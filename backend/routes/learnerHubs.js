import express from 'express';
import LearnerHub from '../models/LearnerHub.js';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/learner-hubs
// @desc    Get all learner hubs (with filters)
// @access  Public
router.get('/', async (req, res) => {
    try {
        const { category, privacyType, search } = req.query;
        let query = {};

        if (category) query.category = category;
        if (privacyType) query.privacyType = privacyType;
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }

        const hubs = await LearnerHub.find(query)
            .populate('creator', 'name avatar')
            .sort('-createdAt')
            .limit(20);

        res.json(hubs);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   POST /api/learner-hubs
// @desc    Create a new learner hub
// @access  Private
router.post('/', protect, async (req, res) => {
    try {
        const hub = await LearnerHub.create({
            ...req.body,
            creator: req.user._id,
            members: [{
                user: req.user._id,
                role: 'admin'
            }]
        });

        // Add hub to user's learnerHubs array
        await User.findByIdAndUpdate(req.user._id, {
            $push: { learnerHubs: hub._id }
        });

        res.status(201).json(hub);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   GET /api/learner-hubs/:id
// @desc    Get single learner hub
// @access  Public
router.get('/:id', async (req, res) => {
    try {
        const hub = await LearnerHub.findById(req.params.id)
            .populate('creator', 'name avatar')
            .populate('members.user', 'name avatar points level')
            .populate('roadmap')
            .populate('industryMentors', 'name avatar bio');

        if (hub) {
            res.json(hub);
        } else {
            res.status(404).json({ message: 'Hub not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   POST /api/learner-hubs/:id/join
// @desc    Join a learner hub
// @access  Private
router.post('/:id/join', protect, async (req, res) => {
    try {
        const hub = await LearnerHub.findById(req.params.id);

        if (!hub) {
            return res.status(404).json({ message: 'Hub not found' });
        }

        // Check if already a member
        const isMember = hub.members.some(m => m.user.toString() === req.user._id.toString());
        if (isMember) {
            return res.status(400).json({ message: 'Already a member' });
        }

        if (hub.privacyType === 'public') {
            hub.members.push({ user: req.user._id, role: 'member' });
            await hub.save();

            await User.findByIdAndUpdate(req.user._id, {
                $push: { learnerHubs: hub._id }
            });

            res.json({ message: 'Successfully joined the hub' });
        } else if (hub.privacyType === 'request-to-join') {
            // Check if already requested
            const hasRequested = hub.pendingRequests.some(r => r.user.toString() === req.user._id.toString());
            if (hasRequested) {
                return res.status(400).json({ message: 'Request already sent' });
            }

            hub.pendingRequests.push({
                user: req.user._id,
                message: req.body.message
            });
            await hub.save();

            res.json({ message: 'Join request sent' });
        } else {
            res.status(403).json({ message: 'This hub is closed' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   POST /api/learner-hubs/:id/approve/:userId
// @desc    Approve join request
// @access  Private (Admin/Moderator)
router.post('/:id/approve/:userId', protect, async (req, res) => {
    try {
        const hub = await LearnerHub.findById(req.params.id);

        if (!hub) {
            return res.status(404).json({ message: 'Hub not found' });
        }

        // Check if user is admin or moderator
        const member = hub.members.find(m => m.user.toString() === req.user._id.toString());
        if (!member || (member.role !== 'admin' && member.role !== 'moderator')) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        // Remove from pending and add to members
        hub.pendingRequests = hub.pendingRequests.filter(
            r => r.user.toString() !== req.params.userId
        );
        hub.members.push({ user: req.params.userId, role: 'member' });
        await hub.save();

        await User.findByIdAndUpdate(req.params.userId, {
            $push: { learnerHubs: hub._id }
        });

        res.json({ message: 'User approved' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   DELETE /api/learner-hubs/:id/leave
// @desc    Leave a learner hub
// @access  Private
router.delete('/:id/leave', protect, async (req, res) => {
    try {
        const hub = await LearnerHub.findById(req.params.id);

        if (!hub) {
            return res.status(404).json({ message: 'Hub not found' });
        }

        hub.members = hub.members.filter(m => m.user.toString() !== req.user._id.toString());
        await hub.save();

        await User.findByIdAndUpdate(req.user._id, {
            $pull: { learnerHubs: hub._id }
        });

        res.json({ message: 'Left the hub' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   POST /api/learner-hubs/:id/resources
// @desc    Add resource to hub
// @access  Private (Members only)
router.post('/:id/resources', protect, async (req, res) => {
    try {
        const hub = await LearnerHub.findById(req.params.id);

        if (!hub) {
            return res.status(404).json({ message: 'Hub not found' });
        }

        const isMember = hub.members.some(m => m.user.toString() === req.user._id.toString());
        if (!isMember) {
            return res.status(403).json({ message: 'Not a member' });
        }

        hub.resources.push({
            ...req.body,
            uploadedBy: req.user._id
        });

        await hub.save();
        res.json(hub);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;
