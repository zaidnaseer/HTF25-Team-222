import express from 'express';
import User from '../models/User.js';
import Session from '../models/Session.js';
import Rating from '../models/Rating.js';
import { protect } from '../middleware/auth.js';

// --- Timezone Imports ---
import { formatISO, addDays, addMinutes, startOfDay, getDay, parse } from 'date-fns';
import { toZonedTime, fromZonedTime } from 'date-fns-tz';

const router = express.Router();

// @route    GET /api/trainers
// @desc     Get all trainers with filters
// @access   Public
router.get('/', async (req, res) => {
    try {
        const { domain, minRating, maxPrice, search, sort } = req.query;
        let query = { isTrainer: true };

        if (domain) query['trainerProfile.domain'] = { $in: [domain] };
        if (minRating) query.averageRating = { $gte: parseFloat(minRating) };
        if (maxPrice) query['trainerProfile.pricing.hourlyRate'] = { $lte: parseFloat(maxPrice) };
        if (search) query.$or = [{ name: { $regex: search, $options: 'i' } }, { bio: { $regex: search, $options: 'i' } }];

        let sortOption = '-averageRating';
        if (sort === 'price-low') sortOption = 'trainerProfile.pricing.hourlyRate';
        if (sort === 'price-high') sortOption = '-trainerProfile.pricing.hourlyRate';
        if (sort === 'students') sortOption = '-trainerProfile.totalStudents';

        const trainers = await User.find(query).select('-password').sort(sortOption).limit(20);
        res.json(trainers);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route    GET /api/trainers/:id
// @desc     Get trainer profile with reviews
// @access   Public
router.get('/:id', async (req, res) => {
    try {
        const trainer = await User.findById(req.params.id)
            .select('-password')
            .populate('learnerHubs', 'name _id');

        if (!trainer || !trainer.isTrainer) {
            return res.status(404).json({ message: 'Trainer not found' });
        }
        const ratings = await Rating.find({ trainer: req.params.id })
            .populate('learner', 'name avatar')
            .sort('-createdAt')
            .limit(10);
        res.json({ trainer, ratings });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// ==================== AVAILABILITY ENDPOINTS ====================

// @route    GET /api/trainers/:id/availability
// @desc     Get trainer's availability settings
// @access   Public (or Private if only trainer can see their own)
router.get('/:id/availability', protect, async (req, res) => { // Made protect assuming only trainer sees own
    try {
        // Use req.user._id if route is /availability (no :id) and protected
        const trainerId = req.params.id === 'me' ? req.user._id : req.params.id;
        const trainer = await User.findById(trainerId);

        if (!trainer || !trainer.isTrainer) {
            return res.status(404).json({ message: 'Trainer not found' });
        }
        // Ensure the logged-in user is the trainer they are requesting if needed
        if (req.params.id === 'me' && trainer._id.toString() !== req.user._id.toString()) {
             return res.status(403).json({ message: 'Not authorized' });
        }

        res.json({
            availability: trainer.trainerProfile?.availability || {
                recurring: [],
                exceptions: [],
                timezone: 'Asia/Kolkata' // Default timezone
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch availability', error: error.message });
    }
});


// @route    PUT /api/trainers/availability
// @desc     Update trainer's availability (authenticated)
// @access   Private (Trainers only)
router.put('/availability', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user.isTrainer) return res.status(403).json({ message: 'Only trainers can set availability' });
        if (!user.trainerProfile) user.trainerProfile = {};

        // Simple validation (can be expanded)
        if (!req.body.timezone || !Array.isArray(req.body.recurring)) {
             return res.status(400).json({ message: 'Invalid availability format' });
        }

        user.trainerProfile.availability = req.body;
        await user.save();
        res.json({ message: 'Availability updated', availability: user.trainerProfile.availability });
    } catch (error) {
        res.status(500).json({ message: 'Failed to update availability', error: error.message });
    }
});

// @route    GET /api/trainers/:id/available-slots
// @desc     Get available time slots for a trainer (Timezone Corrected)
// @access   Public
router.get('/:id/available-slots', async (req, res) => {
    try {
        const { startDate, days = 7 } = req.query;
        const trainer = await User.findById(req.params.id);

        if (!trainer || !trainer.isTrainer) return res.status(404).json({ message: 'Trainer not found' });

        const availability = trainer.trainerProfile?.availability;
        if (!availability || !availability.recurring || !availability.timezone) {
            return res.json([]); // Return empty if no availability or timezone set
        }

        const trainerTimezone = availability.timezone;
        const numberOfDays = parseInt(days);
        // Ensure queryStartDate is treated as the start of the day in UTC for consistent range queries
        const queryStartDateUTC = startDate ? startOfDay(new Date(startDate)) : startOfDay(new Date());

        // Calculate end date based on queryStartDate and days
        const queryEndDateUTC = addDays(queryStartDateUTC, numberOfDays);

        // Get existing booked/pending sessions within the relevant date range (UTC comparison)
        const bookedSessions = await Session.find({
            trainer: req.params.id,
            status: 'scheduled', // Correctly includes pending
            scheduledAt: { $gte: queryStartDateUTC, $lt: queryEndDateUTC }
        });
        // --- CHANGE 1: No longer need bookedSlotsUTC array ---
        // const bookedSlotsUTC = bookedSessions.map(s => formatISO(s.scheduledAt));

        const availableSlots = [];
        const nowUTC = new Date(); // Current time in UTC

        for (let i = 0; i < numberOfDays; i++) {
            // --- Calculate the current date IN THE TRAINER'S TIMEZONE ---
            const dateIteratorUTC = addDays(queryStartDateUTC, i); // Iterate using UTC start date
            const currentDateInTrainerTZ = toZonedTime(dateIteratorUTC, trainerTimezone);
            const dayStartInTrainerTZ = startOfDay(currentDateInTrainerTZ); // Start of the day in trainer's TZ
            const dayOfWeek = getDay(dayStartInTrainerTZ); // 0 (Sun) to 6 (Sat)

            // Find recurring availability rule for this day
            const dayRule = availability.recurring.find(r => r.dayOfWeek === dayOfWeek && r.enabled);
            if (!dayRule) continue; // Skip if trainer unavailable

            // Check if this specific date is blocked by an exception
            const dateStringYYYYMMDD = formatISO(dayStartInTrainerTZ, { representation: 'date' });
            const isBlockedDate = availability.exceptions?.some(ex =>
                ex.type === 'blocked' && ex.date === dateStringYYYYMMDD // Comparing date part only
            );
            if (isBlockedDate) continue; // Skip if date is blocked

            // --- Generate slots for the active rule ---
            dayRule.sessionDurations.forEach(duration => {
                // Parse start/end times IN THE TRAINER'S TIMEZONE for this specific date
                const startTimeInTrainerTZ = parse(`${dateStringYYYYMMDD} ${dayRule.startTime}`, 'yyyy-MM-dd HH:mm', dayStartInTrainerTZ);
                const endTimeInTrainerTZ = parse(`${dateStringYYYYMMDD} ${dayRule.endTime}`, 'yyyy-MM-dd HH:mm', dayStartInTrainerTZ);

                let currentSlotStartInTrainerTZ = startTimeInTrainerTZ;

                while (true) {
                    const currentSlotEndInTrainerTZ = addMinutes(currentSlotStartInTrainerTZ, duration);
                    // Break if slot goes past the defined end time
                    if (currentSlotEndInTrainerTZ > endTimeInTrainerTZ) break;

                    // Convert the potential slot start time to UTC
                    const currentSlotStartUTC = fromZonedTime(currentSlotStartInTrainerTZ, trainerTimezone);

                    // --- CHANGE 2: Compare time values instead of ISO strings ---
                    // Check if this exact UTC time matches any booked/pending session's scheduledAt time
                    const isBooked = bookedSessions.some(session =>
                       session.scheduledAt.getTime() === currentSlotStartUTC.getTime()
                    );                    // --- End Change 2 ---

                    // Check if the slot is in the future (compare UTC times)
                    if (currentSlotStartUTC > nowUTC) {
                        availableSlots.push({
                            startTime: formatISO(currentSlotStartUTC), // Send standard UTC ISO string to frontend
                            duration,
                            isBooked // Use the result of the time comparison
                        });
                    }

                    // Move to the next potential slot start time
                    currentSlotStartInTrainerTZ = currentSlotEndInTrainerTZ; // In trainer's TZ
                }
            });
        }

        res.json(availableSlots);

    } catch (error) {
        console.error('Error generating slots:', error);
        res.status(500).json({ message: 'Failed to generate slots', error: error.message });
    }
});
// ==================== EXISTING ENDPOINTS (Kept) ====================

// @route    PUT /api/trainers/profile
// @desc     Update trainer profile
// @access   Private (Trainers only)
router.put('/profile', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user.isTrainer) return res.status(403).json({ message: 'Not a trainer' });
        user.trainerProfile = { ...user.trainerProfile, ...req.body };
        const updatedUser = await user.save();
        res.json(updatedUser);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route    GET /api/trainers/:id/programs
// @desc     Get trainer programs
// @access   Public
router.get('/:id/programs', async (req, res) => {
    try {
        const trainer = await User.findById(req.params.id).select('trainerProfile.pricing.programs');
        if (!trainer || !trainer.isTrainer) return res.status(404).json({ message: 'Trainer not found' });
        res.json(trainer.trainerProfile?.pricing?.programs || []); // Safely access nested property
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;
