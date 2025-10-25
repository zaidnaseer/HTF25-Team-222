import express from 'express';
import Roadmap from '../models/Roadmap.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/roadmaps
// @desc    Get roadmaps (templates and custom)
// @access  Public
router.get('/', async (req, res) => {
    try {
        const { category, difficulty, type, isTemplate } = req.query;
        let query = {};

        if (category) query.category = category;
        if (difficulty) query.difficulty = difficulty;
        if (type) query.type = type;
        if (isTemplate !== undefined) query.isTemplate = isTemplate === 'true';

        const roadmaps = await Roadmap.find(query)
            .populate('createdBy', 'name avatar bio trainerProfile')
            .sort('-usedBy');

        res.json(roadmaps);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   GET /api/roadmaps/approved
// @desc    Get approved/platform roadmaps
// @access  Public
router.get('/approved/all', async (req, res) => {
    try {
        const roadmaps = await Roadmap.find({
            isApproved: true,
            isTemplate: true
        })
            .populate('createdBy', 'name avatar')
            .sort('-usedBy');

        res.json(roadmaps);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   GET /api/roadmaps/trainer/:trainerId
// @desc    Get roadmaps by a specific trainer
// @access  Public
router.get('/trainer/:trainerId', async (req, res) => {
    try {
        const roadmaps = await Roadmap.find({
            createdBy: req.params.trainerId,
            type: 'trainer'
        })
            .populate('createdBy', 'name avatar bio trainerProfile')
            .sort('-createdAt');

        res.json(roadmaps);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   GET /api/roadmaps/my-roadmaps
// @desc    Get user's custom roadmaps and adopted roadmaps
// @access  Private
router.get('/my/all', protect, async (req, res) => {
    try {
        // Get roadmaps created by user
        const created = await Roadmap.find({ createdBy: req.user._id })
            .populate('adoptedFrom', 'title')
            .sort('-createdAt');

        // Get roadmaps adopted by user
        const adopted = await Roadmap.find({
            'adoptedBy.user': req.user._id
        })
            .populate('createdBy', 'name avatar')
            .sort('-createdAt');

        res.json({ created, adopted });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   POST /api/roadmaps
// @desc    Create a custom roadmap
// @access  Private
router.post('/', protect, async (req, res) => {
    try {
        const { isTrainerRoadmap, ...roadmapData } = req.body;
        const roadmap = await Roadmap.create({
            ...roadmapData,
            createdBy: req.user._id,
            type: isTrainerRoadmap ? 'trainer' : 'custom',
            isTemplate: isTrainerRoadmap || false
        });

        res.status(201).json(roadmap);
    } catch (error) {
        res.status(500).json({ message: error.message });
        console.log(error)
    }
});

// @route   POST /api/roadmaps/:id/adopt
// @desc    Adopt a roadmap (create copy for user)
// @access  Private
router.post('/:id/adopt', protect, async (req, res) => {
    try {
        const templateRoadmap = await Roadmap.findById(req.params.id);

        if (!templateRoadmap) {
            return res.status(404).json({ message: 'Roadmap not found' });
        }

        // Check if user already adopted this roadmap
        const existingAdoption = await Roadmap.findOne({
            createdBy: req.user._id,
            adoptedFrom: templateRoadmap._id
        });

        if (existingAdoption) {
            return res.status(400).json({ message: 'You have already adopted this roadmap' });
        }

        // Create a copy of the roadmap for the user
        const adoptedRoadmap = await Roadmap.create({
            title: templateRoadmap.title,
            description: templateRoadmap.description,
            category: templateRoadmap.category,
            difficulty: templateRoadmap.difficulty,
            estimatedDuration: templateRoadmap.estimatedDuration,
            tags: templateRoadmap.tags,
            thumbnail: templateRoadmap.thumbnail,
            milestones: templateRoadmap.milestones,
            createdBy: req.user._id,
            adoptedFrom: templateRoadmap._id,
            type: 'custom',
            isTemplate: false
        });

        // Update the template's adoptedBy array
        templateRoadmap.adoptedBy.push({
            user: req.user._id,
            customizations: req.body.customizations || ''
        });
        templateRoadmap.usedBy += 1;
        await templateRoadmap.save();

        res.status(201).json(adoptedRoadmap);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   GET /api/roadmaps/:id
// @desc    Get single roadmap
// @access  Public
router.get('/:id', async (req, res) => {
    try {
        const roadmap = await Roadmap.findById(req.params.id)
            .populate('createdBy', 'name avatar bio trainerProfile')
            .populate('adoptedFrom', 'title')
            .populate('adoptedBy.user', 'name avatar');

        if (roadmap) {
            res.json(roadmap);
        } else {
            res.status(404).json({ message: 'Roadmap not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   PUT /api/roadmaps/:id
// @desc    Update a roadmap
// @access  Private
router.put('/:id', protect, async (req, res) => {
    try {
        const roadmap = await Roadmap.findById(req.params.id);

        if (!roadmap) {
            return res.status(404).json({ message: 'Roadmap not found' });
        }

        // Check if user owns this roadmap
        if (roadmap.createdBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to update this roadmap' });
        }

        Object.assign(roadmap, req.body);
        await roadmap.save();

        res.json(roadmap);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   DELETE /api/roadmaps/:id
// @desc    Delete a roadmap
// @access  Private
router.delete('/:id', protect, async (req, res) => {
    try {
        const roadmap = await Roadmap.findById(req.params.id);

        if (!roadmap) {
            return res.status(404).json({ message: 'Roadmap not found' });
        }

        // Check if user owns this roadmap
        if (roadmap.createdBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to delete this roadmap' });
        }

        await roadmap.deleteOne();
        res.json({ message: 'Roadmap deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   PUT /api/roadmaps/:id/progress
// @desc    Update roadmap progress
// @access  Private
router.put('/:id/progress', protect, async (req, res) => {
    try {
        const { milestoneIndex, taskIndex, completed } = req.body;

        const roadmap = await Roadmap.findById(req.params.id);

        if (!roadmap) {
            return res.status(404).json({ message: 'Roadmap not found' });
        }

        if (taskIndex !== undefined) {
            roadmap.milestones[milestoneIndex].tasks[taskIndex].completed = completed;
        } else {
            roadmap.milestones[milestoneIndex].completed = completed;
        }

        await roadmap.save();
        res.json(roadmap);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;
