import express from 'express';
import User from '../models/User.js';
import Rating from '../models/Rating.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/trainers
// @desc    Get all trainers with filters
// @access  Public
router.get('/', async (req, res) => {
    try {
        const { domain, minRating, maxPrice, search, sort } = req.query;
        let query = { isTrainer: true };

        if (domain) {
            query['trainerProfile.domain'] = { $in: [domain] };
        }

        if (minRating) {
            query.averageRating = { $gte: parseFloat(minRating) };
        }

        if (maxPrice) {
            query['trainerProfile.pricing.hourlyRate'] = { $lte: parseFloat(maxPrice) };
        }

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { bio: { $regex: search, $options: 'i' } }
            ];
        }

        let sortOption = '-averageRating';
        if (sort === 'price-low') sortOption = 'trainerProfile.pricing.hourlyRate';
        if (sort === 'price-high') sortOption = '-trainerProfile.pricing.hourlyRate';
        if (sort === 'students') sortOption = '-trainerProfile.totalStudents';

        const trainers = await User.find(query)
            .select('-password')
            .sort(sortOption)
            .limit(20);

        res.json(trainers);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   GET /api/trainers/:id
// @desc    Get trainer profile with reviews
// @access  Public
router.get('/:id', async (req, res) => {
    try {
        const trainer = await User.findById(req.params.id).select('-password');

        if (!trainer || !trainer.isTrainer) {
            return res.status(404).json({ message: 'Trainer not found' });
        }

        // Get recent ratings
        const ratings = await Rating.find({ trainer: req.params.id })
            .populate('learner', 'name avatar')
            .sort('-createdAt')
            .limit(10);

        res.json({ trainer, ratings });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   PUT /api/trainers/profile
// @desc    Update trainer profile
// @access  Private (Trainers only)
router.put('/profile', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        if (!user.isTrainer) {
            return res.status(403).json({ message: 'Not a trainer' });
        }

        user.trainerProfile = {
            ...user.trainerProfile,
            ...req.body
        };

        const updatedUser = await user.save();
        res.json(updatedUser);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   GET /api/trainers/:id/programs
// @desc    Get trainer programs
// @access  Public
router.get('/:id/programs', async (req, res) => {
    try {
        const trainer = await User.findById(req.params.id).select('trainerProfile.pricing.programs');

        if (!trainer || !trainer.isTrainer) {
            return res.status(404).json({ message: 'Trainer not found' });
        }

        res.json(trainer.trainerProfile.pricing.programs || []);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;
