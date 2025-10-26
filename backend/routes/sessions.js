import express from 'express';
import Session from '../models/Session.js';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// ==================== LEARNER ENDPOINTS ====================

// @route   GET /api/sessions
// @desc    Get user's sessions
// @access  Private
router.get('/', protect, async (req, res) => {
    try {
        const { status, type, role } = req.query;
        let query = {
            $or: [
                { trainer: req.user._id },
                { learner: req.user._id },
                { 'participants.user': req.user._id }
            ]
        };

        if (status) query.status = status;
        if (type) query.type = type;
        
        if (role === 'trainer') {
            query = { trainer: req.user._id };
            if (status) query.status = status;
        } else if (role === 'learner') {
            query = { learner: req.user._id };
            if (status) query.status = status;
        }

        const sessions = await Session.find(query)
            .populate('trainer', 'name avatar')
            .populate('learner', 'name avatar')
            .populate('learnerHub', 'name')
            .sort('scheduledAt');

        res.json(sessions);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   GET /api/sessions/requests/pending
// @desc    Get learner's pending requests
// @access  Private
router.get('/requests/pending', protect, async (req, res) => {
    try {
        const requests = await Session.find({
            learner: req.user._id,
            status: 'pending'
        })
        .populate('trainer', 'name avatar email')
        .sort({ createdAt: -1 });

        res.json(requests);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch requests', error: error.message });
    }
});

// @route   POST /api/sessions/solo/request
// @desc    Create a solo session request (NEW)
// @access  Private
router.post('/solo/request', protect, async (req, res) => {
    try {
        const { trainerId, requestedSlot, duration, title, description } = req.body;

        // Validate inputs
        if (!trainerId || !requestedSlot || !title || !description) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        // Check if trainer exists and is actually a trainer
        const trainer = await User.findById(trainerId);
        if (!trainer || !trainer.isTrainer) {
            return res.status(404).json({ message: 'Trainer not found' });
        }

        // Check if slot is in the past
        if (new Date(requestedSlot) < new Date()) {
            return res.status(400).json({ message: 'Cannot request past time slots' });
        }

        // Calculate price
        const pricePerHour = trainer.trainerProfile?.pricing?.hourlyRate || 0;
        const calculatedPrice = (pricePerHour * duration) / 60;

        // Create session request
        const session = new Session({
            type: 'one-on-one',
            trainer: trainerId,
            learner: req.user._id,
            title,
            description,
            requestedSlot: new Date(requestedSlot),
            scheduledAt: new Date(requestedSlot),
            duration: duration || 60,
            status: 'pending',
            price: calculatedPrice
        });

        await session.save();

        // TODO: Send notification to trainer
        // await sendNotification(trainerId, 'new_session_request', session);

        res.status(201).json({
            message: 'Session request sent successfully',
            session
        });
    } catch (error) {
        console.error('Error creating request:', error);
        res.status(500).json({ message: 'Failed to create request', error: error.message });
    }
});

// @route   DELETE /api/sessions/requests/:id
// @desc    Cancel a pending request
// @access  Private
router.delete('/requests/:id', protect, async (req, res) => {
    try {
        const session = await Session.findOne({
            _id: req.params.id,
            learner: req.user._id,
            status: 'pending'
        });

        if (!session) {
            return res.status(404).json({ message: 'Request not found or already processed' });
        }

        session.status = 'cancelled';
        await session.save();

        res.json({ message: 'Request cancelled successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to cancel request', error: error.message });
    }
});

// ==================== TRAINER ENDPOINTS ====================

// @route   GET /api/sessions/requests/trainer
// @desc    Get trainer's pending requests
// @access  Private
router.get('/requests/trainer', protect, async (req, res) => {
    try {
        const requests = await Session.find({
            trainer: req.user._id,
            status: 'pending'
        })
        .populate('learner', 'name avatar email bio')
        .sort({ createdAt: -1 });

        res.json(requests);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch requests', error: error.message });
    }
});

// @route   POST /api/sessions/solo/:id/approve
// @desc    Approve a session request
// @access  Private (Trainer only)
router.post('/solo/:id/approve', protect, async (req, res) => {
    try {
        const session = await Session.findOne({
            _id: req.params.id,
            trainer: req.user._id,
            status: 'pending'
        });

        if (!session) {
            return res.status(404).json({ message: 'Session request not found' });
        }

        // Update session status
        session.status = 'scheduled';
        
        // Generate Zoom link (mock for now)
        const meetingId = Math.floor(Math.random() * 1000000000);
        session.meetingLink = `https://zoom.us/j/${meetingId}`;
        
        await session.save();

        // Update trainer stats
        await User.findByIdAndUpdate(req.user._id, {
            $inc: { 'trainerProfile.totalSessions': 1 }
        });

        // TODO: Send notifications to learner
        // await sendNotification(session.learner, 'session_approved', session);
        // await scheduleReminders(session);

        res.json({
            message: 'Session approved successfully',
            session
        });
    } catch (error) {
        res.status(500).json({ message: 'Failed to approve request', error: error.message });
    }
});

// @route   POST /api/sessions/solo/:id/reject
// @desc    Reject a session request
// @access  Private (Trainer only)
router.post('/solo/:id/reject', protect, async (req, res) => {
    try {
        const { reason } = req.body;

        if (!reason) {
            return res.status(400).json({ message: 'Rejection reason is required' });
        }

        const session = await Session.findOne({
            _id: req.params.id,
            trainer: req.user._id,
            status: 'pending'
        });

        if (!session) {
            return res.status(404).json({ message: 'Session request not found' });
        }

        session.status = 'rejected';
        session.rejectionReason = reason;
        await session.save();

        // TODO: Send notification to learner
        // await sendNotification(session.learner, 'session_rejected', session);

        res.json({
            message: 'Session request rejected',
            session
        });
    } catch (error) {
        res.status(500).json({ message: 'Failed to reject request', error: error.message });
    }
});

// @route   POST /api/sessions/solo/:id/suggest-alternative
// @desc    Suggest alternative times
// @access  Private (Trainer only)
router.post('/solo/:id/suggest-alternative', protect, async (req, res) => {
    try {
        const { suggestedSlots } = req.body;

        if (!suggestedSlots || !Array.isArray(suggestedSlots) || suggestedSlots.length === 0) {
            return res.status(400).json({ message: 'Please provide alternative time slots' });
        }

        const session = await Session.findOne({
            _id: req.params.id,
            trainer: req.user._id,
            status: 'pending'
        });

        if (!session) {
            return res.status(404).json({ message: 'Session request not found' });
        }

        session.suggestedAlternatives = suggestedSlots.map(slot => new Date(slot));
        await session.save();

        // TODO: Send notification to learner with alternative times
        // await sendNotification(session.learner, 'alternative_times_suggested', session);

        res.json({
            message: 'Alternative times suggested',
            session
        });
    } catch (error) {
        res.status(500).json({ message: 'Failed to suggest alternatives', error: error.message });
    }
});

// ==================== EXISTING ENDPOINTS (Kept) ====================

// @route   POST /api/sessions
// @desc    Book a session (OLD METHOD - kept for backward compatibility)
// @access  Private
router.post('/', protect, async (req, res) => {
    try {
        const { trainerId, scheduledAt, duration, type, learnerHubId, price } = req.body;

        // Generate Zoom meeting link (mock)
        const meetingId = Math.random().toString(36).substring(7);
        const meetingLink = `https://zoom.us/j/${meetingId}`;

        const sessionData = {
            title: req.body.title,
            description: req.body.description,
            trainer: trainerId,
            type,
            scheduledAt,
            duration,
            meetingLink,
            price: price || 0,
            status: 'scheduled' // Old method bypasses approval
        };

        if (type === 'one-on-one') {
            sessionData.learner = req.user._id;
        } else {
            sessionData.learnerHub = learnerHubId;
            sessionData.participants = [{ user: req.user._id, joinedAt: new Date() }];
            sessionData.maxParticipants = req.body.maxParticipants || 50;
        }

        const session = await Session.create(sessionData);

        // Update trainer stats
        await User.findByIdAndUpdate(trainerId, {
            $inc: { 'trainerProfile.totalSessions': 1 }
        });

        res.status(201).json(session);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   GET /api/sessions/:id
// @desc    Get session details
// @access  Private
router.get('/:id', protect, async (req, res) => {
    try {
        const session = await Session.findById(req.params.id)
            .populate('trainer', 'name avatar email')
            .populate('learner', 'name avatar email')
            .populate('learnerHub', 'name')
            .populate('participants.user', 'name avatar');

        if (!session) {
            return res.status(404).json({ message: 'Session not found' });
        }

        res.json(session);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   POST /api/sessions/:id/join
// @desc    Join a group session
// @access  Private
router.post('/:id/join', protect, async (req, res) => {
    try {
        const session = await Session.findById(req.params.id);

        if (!session || session.type !== 'group') {
            return res.status(404).json({ message: 'Group session not found' });
        }

        const alreadyJoined = session.participants.some(
            p => p.user.toString() === req.user._id.toString()
        );

        if (alreadyJoined) {
            return res.status(400).json({ message: 'Already joined this session' });
        }

        if (session.participants.length >= session.maxParticipants) {
            return res.status(400).json({ message: 'Session is full' });
        }

        session.participants.push({ user: req.user._id, joinedAt: new Date() });
        await session.save();

        res.json({ message: 'Successfully joined session', meetingLink: session.meetingLink });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   PUT /api/sessions/:id/complete
// @desc    Mark session as completed
// @access  Private (Trainer only)
router.put('/:id/complete', protect, async (req, res) => {
    try {
        const session = await Session.findById(req.params.id);

        if (!session) {
            return res.status(404).json({ message: 'Session not found' });
        }

        if (session.trainer.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        session.status = 'completed';
        session.completedAt = new Date();
        session.notes = req.body.notes;
        session.recordingUrl = req.body.recordingUrl;

        await session.save();
        res.json(session);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   POST /api/sessions/:id/payment
// @desc    Process mock payment
// @access  Private
router.post('/:id/payment', protect, async (req, res) => {
    try {
        const session = await Session.findById(req.params.id);

        if (!session) {
            return res.status(404).json({ message: 'Session not found' });
        }

        // Mock payment processing
        session.paymentStatus = 'paid';
        await session.save();

        res.json({
            message: 'Payment successful (mock)',
            transactionId: `TXN${Date.now()}`,
            amount: session.price
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;
