// ✅ CORRECTED CODE for backend/routes/learnerHubs.js

import express from 'express';
import LearnerHub from '../models/LearnerHub.js';
import User from '../models/User.js';
import Activity from '../models/Activity.js';
import Message from '../models/Message.js';
import { protect } from '../middleware/auth.js';
import upload from '../config/fileUpload.js';

const router = express.Router();

// @route    GET /api/hubs
// @desc     Get all learner hubs (with filters)
// @access   Public
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

// @route    POST /api/hubs
// @desc     Create a new learner hub
// @access   Private
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

// @route    GET /api/hubs/:id
// @desc     Get single learner hub
// @access   Public
router.get('/:id', async (req, res) => {
    try {
        const hub = await LearnerHub.findById(req.params.id)
            .populate('creator', 'name avatar')
            .populate('members.user', 'name avatar points level')
            .populate('pendingRequests.user', 'name avatar email')
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

// @route    POST /api/hubs/:id/join
// @desc     Join a learner hub
// @access   Private
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
            // *** THIS WAS THE TYPO ***
            res.status(403).json({ message: 'This hub is closed' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route    POST /api/hubs/:id/approve/:userId
// @desc     Approve join request
// @access   Private (Admin/Moderator)
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

// @route   POST /api/hubs/:id/reject/:userId
// @desc    Reject join request
// @access  Private (Admin/Moderator)
router.post('/:id/reject/:userId', protect, async (req, res) => {
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

        // Remove from pending requests
        hub.pendingRequests = hub.pendingRequests.filter(
            r => r.user.toString() !== req.params.userId
        );
        await hub.save();

        res.json({ message: 'Request rejected' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   DELETE /api/hubs/:id/leave
// @desc    Leave a learner hub
// @access  Private
router.delete('/:id/leave', protect, async (req, res) => {
    try {
        const hub = await LearnerHub.findById(req.params.id);

        if (!hub) {
            return res.status(404).json({ message: 'Hub not found' });
        }

        const isCreator = hub.creator.toString() === req.user._id.toString();

        // Check if user is a member
        const isMember = hub.members.some(m => m.user.toString() === req.user._id.toString());
        if (!isMember) {
            return res.status(400).json({ message: 'You are not a member of this hub' });
        }

        // If creator is leaving
        if (isCreator) {
            const { action, newOwnerId } = req.body;

            if (action === 'delete') {
                // Delete all activities associated with this hub
                await Activity.deleteMany({ learnerHub: hub._id });

                // Delete all messages associated with this hub
                await Message.deleteMany({ learnerHub: hub._id });

                // Delete the entire hub
                await LearnerHub.findByIdAndDelete(req.params.id);

                // Remove hub from all members' learnerHubs array
                await User.updateMany(
                    { learnerHubs: hub._id },
                    { $pull: { learnerHubs: hub._id } }
                );

                return res.json({ message: 'Hub deleted successfully', deleted: true });
            } else if (action === 'transfer') {
                if (newOwnerId) {
                    // Transfer ownership to specified member
                    const newOwner = hub.members.find(m => m.user.toString() === newOwnerId);
                    if (!newOwner) {
                        return res.status(400).json({ message: 'Selected user is not a member' });
                    }

                    hub.creator = newOwnerId;
                    // Update new owner's role to admin if not already
                    const ownerMember = hub.members.find(m => m.user.toString() === newOwnerId);
                    if (ownerMember) {
                        ownerMember.role = 'admin';
                    }
                } else {
                    // Randomly assign a new owner
                    const otherMembers = hub.members.filter(m => m.user.toString() !== req.user._id.toString());
                    if (otherMembers.length === 0) {
                        // If creator is the only member, delete the hub and associated data
                        await Activity.deleteMany({ learnerHub: hub._id });
                        await Message.deleteMany({ learnerHub: hub._id });
                        await LearnerHub.findByIdAndDelete(req.params.id);
                        await User.findByIdAndUpdate(req.user._id, {
                            $pull: { learnerHubs: hub._id }
                        });
                        return res.json({ message: 'Hub deleted as you were the only member', deleted: true });
                    }

                    const randomIndex = Math.floor(Math.random() * otherMembers.length);
                    const newOwnerId = otherMembers[randomIndex].user;
                    hub.creator = newOwnerId;
                    // Update new owner's role to admin
                    const ownerMember = hub.members.find(m => m.user.toString() === newOwnerId.toString());
                    if (ownerMember) {
                        ownerMember.role = 'admin';
                    }
                }

                // Remove old owner from members and downgrade to member if they rejoin
                hub.members = hub.members.filter(m => m.user.toString() !== req.user._id.toString());
                await hub.save();

                await User.findByIdAndUpdate(req.user._id, {
                    $pull: { learnerHubs: hub._id }
                });

                return res.json({ message: 'Ownership transferred and you have left the hub' });
            } else {
                return res.status(400).json({ message: 'Invalid action. Must be "delete" or "transfer"' });
            }
        }

        // Regular member leaving
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
// @access  Private (Admin only)
router.post('/:id/resources', protect, upload.single('file'), async (req, res) => {
    try {
        const hub = await LearnerHub.findById(req.params.id);

        if (!hub) {
            return res.status(404).json({ message: 'Hub not found' });
        }

        // Check if user is admin
        const member = hub.members.find(m => m.user.toString() === req.user._id.toString());
        if (!member || member.role !== 'admin') {
            return res.status(403).json({ message: 'Only admins can add resources' });
        }

        // Handle file upload
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

            const resourceData = {
                title: req.body.title,
                type: req.file.mimetype === 'application/pdf' ? 'document' : 'text',
                url: `/uploads/${req.file.filename}`,
                filename: req.file.filename,
                mimeType: req.file.mimetype,
                uploadedBy: req.user._id,
                uploadedAt: new Date()
            };        hub.resources.push(resourceData);
        await hub.save();

        res.json(hub.resources[hub.resources.length - 1]);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   DELETE /api/learner-hubs/:id/resources/:resourceId
// @desc    Delete a resource
// @access  Private (Admin only)
router.delete('/:id/resources/:resourceId', protect, async (req, res) => {
    try {
        const hub = await LearnerHub.findById(req.params.id);

        if (!hub) {
            return res.status(404).json({ message: 'Hub not found' });
        }

        // Check if user is admin
        const member = hub.members.find(m => m.user.toString() === req.user._id.toString());
        if (!member || member.role !== 'admin') {
            return res.status(403).json({ message: 'Only admins can delete resources' });
        }

        hub.resources = hub.resources.filter(r => r._id.toString() !== req.params.resourceId);
        await hub.save();

        res.json({ message: 'Resource deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;
