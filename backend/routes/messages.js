import express from 'express';
import Message from '../models/Message.js';
import LearnerHub from '../models/LearnerHub.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/messages/:hubId
// @desc    Get messages for a learner hub
// @access  Private
router.get('/:hubId', protect, async (req, res) => {
    try {
        const { limit = 50, before } = req.query;

        let query = { learnerHub: req.params.hubId };
        if (before) {
            query.createdAt = { $lt: new Date(before) };
        }

        const messages = await Message.find(query)
            .populate('sender', 'name avatar')
            .populate('replyTo')
            .sort('-createdAt')
            .limit(parseInt(limit));

        res.json(messages.reverse());
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   POST /api/messages
// @desc    Send a message
// @access  Private
router.post('/', protect, async (req, res) => {
    try {
        const { hubId, content, type, fileUrl, replyTo } = req.body;

        // Verify user is member
        const hub = await LearnerHub.findById(hubId);
        const isMember = hub.members.some(m => m.user.toString() === req.user._id.toString());

        if (!isMember) {
            return res.status(403).json({ message: 'Not a member of this hub' });
        }

        const message = await Message.create({
            learnerHub: hubId,
            sender: req.user._id,
            content,
            type: type || 'text',
            fileUrl,
            replyTo
        });

        const populatedMessage = await Message.findById(message._id)
            .populate('sender', 'name avatar');

        res.status(201).json(populatedMessage);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   POST /api/messages/:id/react
// @desc    React to a message
// @access  Private
router.post('/:id/react', protect, async (req, res) => {
    try {
        const { emoji } = req.body;
        const message = await Message.findById(req.params.id);

        if (!message) {
            return res.status(404).json({ message: 'Message not found' });
        }

        // Remove existing reaction from this user
        message.reactions = message.reactions.filter(
            r => r.user.toString() !== req.user._id.toString() || r.emoji !== emoji
        );

        // Add new reaction
        message.reactions.push({ user: req.user._id, emoji });
        await message.save();

        res.json(message);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;
