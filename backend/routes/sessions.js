import express from 'express';
import Session from '../models/Session.js';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/sessions
// @desc    Get user's sessions
// @access  Private
router.get('/', protect, async (req, res) => {
    try {
        const { status, type } = req.query;
        let query = {
            $or: [
                { trainer: req.user._id },
                { learner: req.user._id },
                { 'participants.user': req.user._id }
            ]
        };

        if (status) query.status = status;
        if (type) query.type = type;

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

// @route   POST /api/sessions
// @desc    Book a session
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
            price: price || 0
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
