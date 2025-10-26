import express from 'express';
import Roadmap from '../models/Roadmap.js';
import { protect } from '../middleware/auth.js';
import { callGroqGenerate } from '../lib/groqClient.js';

const router = express.Router();

// --- EXISTING ROUTES ---

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
        if (isTemplate !== undefined) query.isTemplate = (isTemplate === 'true');

        const roadmaps = await Roadmap.find(query)
            .populate('createdBy', 'name avatar')
            .sort({ usedBy: -1, createdAt: -1 });

        res.json(roadmaps);
    } catch (error) {
        console.error("Error fetching roadmaps:", error);
        res.status(500).json({ message: 'Server error fetching roadmaps' });
    }
});

// @route   GET /api/roadmaps/approved/all
// @desc    Get approved/platform roadmaps (Templates)
// @access  Public
router.get('/approved/all', async (req, res) => {
    try {
        const roadmaps = await Roadmap.find({
            type: 'approved',
            isTemplate: true
        })
            .populate('createdBy', 'name avatar')
            .sort({ usedBy: -1, createdAt: -1 });

        res.json(roadmaps);
    } catch (error) {
        console.error("Error fetching approved roadmaps:", error);
        res.status(500).json({ message: 'Server error fetching approved roadmaps' });
    }
});

// @route   GET /api/roadmaps/trainer/:trainerId
// @desc    Get roadmaps created by a specific trainer (Templates)
// @access  Public
router.get('/trainer/:trainerId', async (req, res) => {
    try {
        const roadmaps = await Roadmap.find({
            createdBy: req.params.trainerId,
            type: 'trainer',
            isTemplate: true
        })
            .populate('createdBy', 'name avatar')
            .sort('-createdAt');

        res.json(roadmaps);
    } catch (error) {
        console.error("Error fetching trainer roadmaps:", error);
        res.status(500).json({ message: 'Server error fetching trainer roadmaps' });
    }
});

// @route   GET /api/roadmaps/my/all
// @desc    Get user's created roadmaps and adopted roadmaps
// @access  Private
router.get('/my/all', protect, async (req, res) => {
    try {
        const created = await Roadmap.find({
            createdBy: req.user._id,
            isTemplate: false
        })
            .populate('adoptedFrom', 'title category')
            .sort('-createdAt');

        const adoptedCopies = await Roadmap.find({
            createdBy: req.user._id,
            adoptedFrom: { $exists: true, $ne: null }
        })
            .populate('adoptedFrom', 'title category createdBy')
            .populate({
                path: 'adoptedFrom',
                populate: {
                    path: 'createdBy',
                    select: 'name avatar'
                }
            })
            .sort('-createdAt');

        res.json({ created, adopted: adoptedCopies });
    } catch (error) {
        console.error("Error fetching user's roadmaps:", error);
        res.status(500).json({ message: "Server error fetching user's roadmaps" });
    }
});

// @route   POST /api/roadmaps
// @desc    Create a custom roadmap MANUALLY
// @access  Private
router.post('/', protect, async (req, res) => {
    try {
        const { title, description, category, difficulty, estimatedDuration, tags, milestones, isTrainerRoadmap } = req.body;

        // Basic Validation
        if (!title || !category || !milestones || milestones.length === 0) {
            return res.status(400).json({ message: 'Title, category, and at least one milestone are required.' });
        }

        if (milestones.some(m => !m.title || !m.tasks || m.tasks.length === 0 || m.tasks.some(t => !t.title))) {
            return res.status(400).json({ message: 'Each milestone and task must have a title.' });
        }

        const newRoadmap = new Roadmap({
            title,
            description,
            category,
            difficulty: difficulty || 'beginner',
            estimatedDuration,
            tags: tags || [],
            milestones: milestones.map((m, index) => ({
                title: m.title,
                description: m.description || '',
                order: m.order || index + 1,
                tasks: m.tasks.map(t => ({
                    title: t.title,
                    description: t.description || '',
                    resources: t.resources || [],
                    completed: false,
                })),
                completed: false,
            })),
            createdBy: req.user._id,
            type: req.user.isTrainer && isTrainerRoadmap ? 'trainer' : 'custom',
            isTemplate: req.user.isTrainer && isTrainerRoadmap ? true : false,
            adoptedBy: [],
            usedBy: 0,
        });

        const savedRoadmap = await newRoadmap.save();
        res.status(201).json(savedRoadmap);
    } catch (error) {
        console.error("Error creating manual roadmap:", error);
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: "Validation failed", details: error.errors });
        }
        res.status(500).json({ message: 'Server error creating roadmap' });
    }
});

// --- NEW ROUTE: Generate Roadmap using AI (Groq) ---
router.post('/generate', protect, async (req, res) => {
    const { topic, goal, difficulty, duration } = req.body;
    const userId = req.user._id;

    if (!topic) {
        return res.status(400).json({ message: 'Topic is required for AI generation' });
    }

    const prompt = `Generate a comprehensive learning roadmap about "${topic}".

Main goal: "${goal || 'Become proficient'}"
Target difficulty: ${difficulty || 'Beginner'}
Desired duration: ${duration || 'Flexible'}

You must respond with ONLY a valid JSON object (no markdown code blocks, no explanations, no extra text) matching this exact structure:

{
  "title": "Roadmap title",
  "description": "Short description (2-3 sentences)",
  "category": "ONE category from: Web Development, Mobile Development, Data Science, AI/ML, DevOps, Cloud Computing, Cybersecurity, Blockchain, Game Development, UI/UX Design, Backend Development, Frontend Development, Full Stack Development, Database Management, Programming Fundamentals",
  "difficulty": "beginner, intermediate, or advanced",
  "estimatedDuration": "realistic duration like '3 months', '8 weeks', '6 months'",
  "tags": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"],
  "milestones": [
    {
      "title": "Milestone 1 Title",
      "description": "What the learner will achieve in this milestone",
      "tasks": [
        { "title": "Task 1.1 Title", "description": "Specific action or learning objective" },
        { "title": "Task 1.2 Title", "description": "Specific action or learning objective" }
      ]
    }
  ]
}

Requirements:
- Provide 4-6 milestones that progress logically
- Each milestone should have 3-5 tasks
- Tasks should be specific, actionable, and ordered by complexity
- Descriptions should be clear and educational
- Output ONLY the JSON object, nothing else`;

    console.log(`[AI Roadmap] Generating for topic: "${topic}" by user ${userId}`);

    try {
        // Call Groq API
        const aiResponseContent = await callGroqGenerate(prompt, {
            max_tokens: 2500,
            temperature: 0.7,
        });

        let roadmapData;
        try {
            // Clean response - remove markdown code blocks if present
            let cleanedResponse = aiResponseContent.trim();
            
            if (cleanedResponse.startsWith('```json')) {
                cleanedResponse = cleanedResponse.replace(/```json\n?/g, '').replace(/```\n?$/g, '');
            } else if (cleanedResponse.startsWith('```')) {
                cleanedResponse = cleanedResponse.replace(/```\n?/g, '').replace(/```\n?$/g, '');
            }
            
            roadmapData = JSON.parse(cleanedResponse);

            // Validate structure
            if (!roadmapData.title || !roadmapData.milestones || !Array.isArray(roadmapData.milestones) || roadmapData.milestones.length === 0) {
                throw new Error("AI response missing required fields or milestones.");
            }
            
            if (roadmapData.milestones.some(m => !m.title || !m.tasks || !Array.isArray(m.tasks) || m.tasks.length === 0 || m.tasks.some(t => !t.title))) {
                throw new Error("AI response has invalid milestone or task structure.");
            }
        } catch (parseError) {
            console.error("[AI Roadmap] Failed to parse JSON response:", aiResponseContent, parseError);
            return res.status(500).json({ 
                message: 'AI generated invalid data. Please try refining your topic.',
                details: process.env.NODE_ENV === 'development' ? aiResponseContent : undefined
            });
        }

        // Create and save roadmap
        const newRoadmap = new Roadmap({
            title: roadmapData.title,
            description: roadmapData.description,
            category: roadmapData.category,
            difficulty: roadmapData.difficulty?.toLowerCase() || 'beginner',
            estimatedDuration: roadmapData.estimatedDuration,
            tags: roadmapData.tags || [],
            milestones: roadmapData.milestones.map((m, index) => ({
                title: m.title,
                description: m.description || '',
                order: index + 1,
                tasks: m.tasks.map(t => ({
                    title: t.title,
                    description: t.description || '',
                    resources: [],
                    completed: false,
                })),
                completed: false,
            })),
            createdBy: userId,
            type: 'custom',
            isTemplate: false,
            adoptedBy: [{ user: userId, progress: [] }],
            usedBy: 1,
            isApproved: false
        });

        const savedRoadmap = await newRoadmap.save();
        console.log(`[AI Roadmap] Saved roadmap ${savedRoadmap._id} for topic "${topic}"`);
        res.status(201).json(savedRoadmap);

    } catch (error) {
        console.error('[AI Roadmap] Error during generation:', error);
        
        // Handle Groq-specific errors
        if (error.status) {
            return res.status(error.status).json({ 
                message: `AI Service Error: ${error.message}`,
                details: process.env.NODE_ENV === 'development' ? error.details : undefined
            });
        }
        
        res.status(500).json({ message: 'Server error during AI roadmap generation.' });
    }
});
// --- End NEW AI ROUTE ---

// @route   POST /api/roadmaps/:id/adopt
// @desc    Adopt a roadmap template (create a user copy)
// @access  Private
router.post('/:id/adopt', protect, async (req, res) => {
    try {
        const templateRoadmap = await Roadmap.findOne({ _id: req.params.id, isTemplate: true });
        
        if (!templateRoadmap) {
            return res.status(404).json({ message: 'Roadmap template not found or cannot be adopted' });
        }

        const existingAdoption = await Roadmap.findOne({
            createdBy: req.user._id,
            adoptedFrom: templateRoadmap._id,
            isTemplate: false
        });

        if (existingAdoption) {
            return res.status(400).json({ message: 'You have already adopted this roadmap', existingRoadmapId: existingAdoption._id });
        }

        const adoptedRoadmap = new Roadmap({
            title: templateRoadmap.title,
            description: templateRoadmap.description,
            category: templateRoadmap.category,
            difficulty: templateRoadmap.difficulty,
            estimatedDuration: templateRoadmap.estimatedDuration,
            tags: templateRoadmap.tags,
            thumbnail: templateRoadmap.thumbnail,
            milestones: templateRoadmap.milestones.map((m, index) => ({
                title: m.title,
                description: m.description,
                order: m.order || index + 1,
                tasks: m.tasks.map(t => ({
                    title: t.title,
                    description: t.description,
                    resources: t.resources || [],
                    completed: false,
                })),
                completed: false,
            })),
            createdBy: req.user._id,
            adoptedFrom: templateRoadmap._id,
            type: 'custom',
            isTemplate: false,
            adoptedBy: [{ user: req.user._id, progress: [] }],
            usedBy: 1,
            isApproved: false,
        });

        const savedAdoptedRoadmap = await adoptedRoadmap.save();

        templateRoadmap.adoptedBy.push({ user: req.user._id });
        templateRoadmap.usedBy = (templateRoadmap.usedBy || 0) + 1;
        await templateRoadmap.save();

        res.status(201).json(savedAdoptedRoadmap);
    } catch (error) {
        console.error("Error adopting roadmap:", error);
        res.status(500).json({ message: 'Server error adopting roadmap' });
    }
});

// @route   GET /api/roadmaps/:id
// @desc    Get single roadmap details
// @access  Private (user must be logged in)
router.get('/:id', protect, async (req, res) => {
    try {
        const roadmap = await Roadmap.findById(req.params.id)
            .populate('createdBy', 'name avatar bio isTrainer')
            .populate('adoptedFrom', 'title category')
            .populate('adoptedBy.user', 'name avatar');

        if (!roadmap) {
            return res.status(404).json({ message: 'Roadmap not found' });
        }

        res.json(roadmap);
    } catch (error) {
        console.error(`Error fetching roadmap ${req.params.id}:`, error);
        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'Invalid roadmap ID format' });
        }
        res.status(500).json({ message: 'Server error fetching roadmap details' });
    }
});

// @route   PUT /api/roadmaps/:id
// @desc    Update a roadmap (only owner can update)
// @access  Private
router.put('/:id', protect, async (req, res) => {
    try {
        const roadmap = await Roadmap.findById(req.params.id);

        if (!roadmap) {
            return res.status(404).json({ message: 'Roadmap not found' });
        }

        if (roadmap.createdBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to update this roadmap' });
        }

        const { adoptedFrom, createdBy, type, isTemplate, adoptedBy, usedBy, ...updateData } = req.body;

        if (updateData.milestones) {
            updateData.milestones = updateData.milestones.map((m, index) => ({
                title: m.title || `Milestone ${index + 1}`,
                description: m.description || '',
                order: m.order || index + 1,
                tasks: m.tasks?.map(t => ({
                    title: t.title || 'Untitled Task',
                    description: t.description || '',
                    resources: t.resources || [],
                    completed: t.completed || false,
                })) || [],
                completed: m.completed || false,
            }));
        }

        Object.assign(roadmap, updateData);
        const updatedRoadmap = await roadmap.save();

        res.json(updatedRoadmap);
    } catch (error) {
        console.error(`Error updating roadmap ${req.params.id}:`, error);
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: 'Validation failed', details: error.errors });
        }
        res.status(500).json({ message: 'Server error updating roadmap' });
    }
});

// @route   DELETE /api/roadmaps/:id
// @desc    Delete a roadmap (only owner can delete)
// @access  Private
router.delete('/:id', protect, async (req, res) => {
    try {
        const roadmap = await Roadmap.findById(req.params.id);

        if (!roadmap) {
            return res.status(404).json({ message: 'Roadmap not found' });
        }

        if (roadmap.createdBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to delete this roadmap' });
        }

        if (roadmap.isTemplate && roadmap.adoptedBy && roadmap.adoptedBy.length > 0) {
            console.warn(`Deleting template roadmap ${roadmap._id} which has been adopted ${roadmap.adoptedBy.length} times.`);
        }

        if (roadmap.adoptedFrom) {
            await Roadmap.updateOne(
                { _id: roadmap.adoptedFrom },
                {
                    $pull: { adoptedBy: { user: req.user._id } },
                    $inc: { usedBy: -1 }
                }
            );
        }

        await roadmap.deleteOne();
        res.json({ message: 'Roadmap deleted successfully' });
    } catch (error) {
        console.error(`Error deleting roadmap ${req.params.id}:`, error);
        res.status(500).json({ message: 'Server error deleting roadmap' });
    }
});

// @route   PUT /api/roadmaps/:id/progress
// @desc    Update progress for a task or milestone in an *adopted* roadmap
// @access  Private (User must own the specific roadmap instance)
router.put('/:id/progress', protect, async (req, res) => {
    try {
        const { milestoneIndex, taskIndex, completed } = req.body;
        const roadmap = await Roadmap.findById(req.params.id);

        if (!roadmap) {
            return res.status(404).json({ message: 'Roadmap not found' });
        }

        if (roadmap.createdBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to update progress on this roadmap' });
        }

        if (milestoneIndex === undefined || milestoneIndex < 0 || milestoneIndex >= roadmap.milestones.length) {
            return res.status(400).json({ message: 'Invalid milestone index' });
        }

        let milestone = roadmap.milestones[milestoneIndex];

        if (taskIndex !== undefined) {
            if (taskIndex < 0 || taskIndex >= milestone.tasks.length) {
                return res.status(400).json({ message: 'Invalid task index' });
            }
            milestone.tasks[taskIndex].completed = completed;
        } else {
            milestone.completed = completed;
        }

        await roadmap.save();
        res.json(roadmap);
    } catch (error) {
        console.error(`Error updating progress for roadmap ${req.params.id}:`, error);
        res.status(500).json({ message: 'Server error updating progress' });
    }
});

export default router;
