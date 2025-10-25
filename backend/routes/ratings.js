import express from 'express';
import Rating from '../models/Rating.js';
import User from '../models/User.js';
import Session from '../models/Session.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// @route   POST /api/ratings
// @desc    Create a rating
// @access  Private
router.post('/', protect, async (req, res) => {
    try {
        const { trainerId, sessionId, rating, review, categories } = req.body;

        // Check if session exists and is completed
        const session = await Session.findById(sessionId);
        if (!session || session.status !== 'completed') {
            return res.status(400).json({ message: 'Can only rate completed sessions' });
        }

        // Check if already rated
        const existingRating = await Rating.findOne({
            learner: req.user._id,
            session: sessionId
        });

        if (existingRating) {
            return res.status(400).json({ message: 'Already rated this session' });
        }

        const newRating = await Rating.create({
            trainer: trainerId,
            learner: req.user._id,
            session: sessionId,
            rating,
            review,
            categories
        });

        // Update trainer's average rating
        const allRatings = await Rating.find({ trainer: trainerId });
        const avgRating = allRatings.reduce((acc, r) => acc + r.rating, 0) / allRatings.length;

        await User.findByIdAndUpdate(trainerId, {
            averageRating: avgRating.toFixed(1),
            totalRatings: allRatings.length
        });

        res.status(201).json(newRating);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   GET /api/ratings/trainer/:trainerId
// @desc    Get ratings for a trainer
// @access  Public
router.get('/trainer/:trainerId', async (req, res) => {
    try {
        const ratings = await Rating.find({ trainer: req.params.trainerId })
            .populate('learner', 'name avatar')
            .sort('-createdAt');

        res.json(ratings);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;
