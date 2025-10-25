import express from 'express';
import Roadmap from '../models/Roadmap.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/roadmaps
// @desc    Get roadmaps (templates and custom)
// @access  Public
router.get('/', async (req, res) => {
    try {
        const { category, difficulty, isTemplate } = req.query;
        let query = {};

        if (category) query.category = category;
        if (difficulty) query.difficulty = difficulty;
        if (isTemplate !== undefined) query.isTemplate = isTemplate === 'true';

        const roadmaps = await Roadmap.find(query)
            .populate('createdBy', 'name avatar')
            .sort('-usedBy');

        res.json(roadmaps);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   POST /api/roadmaps
// @desc    Create a custom roadmap
// @access  Private
router.post('/', protect, async (req, res) => {
    try {
        const roadmap = await Roadmap.create({
            ...req.body,
            createdBy: req.user._id,
            isTemplate: false
        });

        res.status(201).json(roadmap);
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
            .populate('createdBy', 'name avatar');

        if (roadmap) {
            res.json(roadmap);
        } else {
            res.status(404).json({ message: 'Roadmap not found' });
        }
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
