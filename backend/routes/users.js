import express from 'express';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/users/profile
// @desc    Get user profile
// @access  Private
router.get('/profile', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id)
            .populate('learnerHubs', 'name coverImage totalMembers')
            .select('-password');
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        if (user) {
            user.name = req.body.name || user.name;
            user.bio = req.body.bio || user.bio;
            user.avatar = req.body.avatar || user.avatar;
            user.skillsToTeach = req.body.skillsToTeach || user.skillsToTeach;
            user.skillsToLearn = req.body.skillsToLearn || user.skillsToLearn;

            const updatedUser = await user.save();
            res.json(updatedUser);
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   POST /api/users/become-trainer
// @desc    Upgrade to trainer account
// @access  Private
router.post('/become-trainer', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        if (user) {
            user.isTrainer = true;
            user.role = user.role === 'learner' ? 'both' : user.role;
            user.trainerProfile = req.body.trainerProfile || {
                domain: [],
                experience: 0,
                pricing: { hourlyRate: 0, programs: [] }
            };

            const updatedUser = await user.save();
            res.json(updatedUser);
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   GET /api/users/:id
// @desc    Get user by ID
// @access  Public
router.get('/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');
        if (user) {
            res.json(user);
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;
