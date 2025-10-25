import express from 'express';
import Activity from '../models/Activity.js';
import LearnerHub from '../models/LearnerHub.js';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/activities
// @desc    Get activities for a learner hub
// @access  Public
router.get('/', async (req, res) => {
    try {
        const { hubId, type, status } = req.query;
        let query = {};

        if (hubId) query.learnerHub = hubId;
        if (type) query.type = type;
        if (status) query.status = status;

        const activities = await Activity.find(query)
            .populate('createdBy', 'name avatar')
            .populate('learnerHub', 'name')
            .sort('startDate');

        res.json(activities);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   POST /api/activities
// @desc    Create an activity
// @access  Private
router.post('/', protect, async (req, res) => {
    try {
        // Verify user is member of the hub
        const hub = await LearnerHub.findById(req.body.learnerHub);
        const isMember = hub.members.some(m => m.user.toString() === req.user._id.toString());

        if (!isMember) {
            return res.status(403).json({ message: 'Not a member of this hub' });
        }

        // Generate meeting link for workshops/meetings
        if (req.body.type === 'workshop' || req.body.type === 'webinar' || req.body.type === 'meeting') {
            const meetingId = Math.random().toString(36).substring(7);
            req.body.meetingLink = `https://zoom.us/j/${meetingId}`;
        }

        const activity = await Activity.create({
            ...req.body,
            createdBy: req.user._id
        });

        res.status(201).json(activity);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   GET /api/activities/:id
// @desc    Get single activity
// @access  Public
router.get('/:id', async (req, res) => {
    try {
        const activity = await Activity.findById(req.params.id)
            .populate('createdBy', 'name avatar')
            .populate('learnerHub', 'name coverImage')
            .populate('participants.user', 'name avatar');

        if (activity) {
            res.json(activity);
        } else {
            res.status(404).json({ message: 'Activity not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   POST /api/activities/:id/participate
// @desc    Participate in an activity (quiz/contest)
// @access  Private
router.post('/:id/participate', protect, async (req, res) => {
    try {
        const activity = await Activity.findById(req.params.id);

        if (!activity) {
            return res.status(404).json({ message: 'Activity not found' });
        }

        const { answers } = req.body;
        let score = 0;

        // Calculate score for quiz/contest
        if (activity.type === 'quiz' || activity.type === 'contest') {
            answers.forEach((answer, index) => {
                if (activity.questions[index].correctAnswer === answer) {
                    score += activity.questions[index].points;
                }
            });
        }

        activity.participants.push({
            user: req.user._id,
            score,
            answers,
            completedAt: new Date()
        });

        await activity.save();

        // Award points to user
        await User.findByIdAndUpdate(req.user._id, {
            $inc: { points: score }
        });

        // Update leaderboard
        const hub = await LearnerHub.findById(activity.learnerHub);
        const leaderboardEntry = hub.leaderboard.find(
            l => l.user.toString() === req.user._id.toString()
        );

        if (leaderboardEntry) {
            leaderboardEntry.points += score;
        } else {
            hub.leaderboard.push({ user: req.user._id, points: score });
        }

        await hub.save();

        res.json({ message: 'Activity completed', score });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   GET /api/activities/:id/leaderboard
// @desc    Get leaderboard for an activity
// @access  Public
router.get('/:id/leaderboard', async (req, res) => {
    try {
        const activity = await Activity.findById(req.params.id)
            .populate('participants.user', 'name avatar');

        if (!activity) {
            return res.status(404).json({ message: 'Activity not found' });
        }

        const leaderboard = activity.participants
            .sort((a, b) => b.score - a.score)
            .slice(0, 10);

        res.json(leaderboard);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;
