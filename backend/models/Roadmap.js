import mongoose from 'mongoose';

const resourceSchema = new mongoose.Schema({
    title: String,
    url: String,
    type: String
}, { _id: false });

const taskSchema = new mongoose.Schema({
    title: String,
    description: String,
    resources: [resourceSchema],
    completed: {
        type: Boolean,
        default: false
    }
}, { _id: false });

const milestoneSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    description: String,
    order: Number,
    tasks: [taskSchema],
    completed: {
        type: Boolean,
        default: false
    }
}, { _id: false });

const roadmapSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    description: String,
    category: {
        type: String,
        required: true
    },
    difficulty: {
        type: String,
        enum: ['beginner', 'intermediate', 'advanced'],
        default: 'beginner'
    },
    type: {
        type: String,
        enum: ['approved', 'trainer', 'custom'],
        default: 'custom' // approved = platform templates, trainer = by trainers, custom = by learners
    },
    isTemplate: {
        type: Boolean,
        default: false // true for pre-built roadmaps that can be adopted
    },
    isApproved: {
        type: Boolean,
        default: false // true for platform-approved roadmaps
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    // For adopted roadmaps
    adoptedFrom: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Roadmap'
    },
    adoptedBy: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        adoptedAt: {
            type: Date,
            default: Date.now
        },
        customizations: String // Any custom notes/changes
    }],
    learnerHub: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'LearnerHub'
    },
    estimatedDuration: String, // e.g., "3 months", "6 weeks"
    tags: [String],
    thumbnail: String,
    milestones: [milestoneSchema],
    usedBy: {
        type: Number,
        default: 0
    },
    // For trainer roadmaps - schedule info
    schedule: {
        startDate: Date,
        endDate: Date,
        sessionsPerWeek: Number,
        price: Number
    }
}, {
    timestamps: true
});

const Roadmap = mongoose.model('Roadmap', roadmapSchema);

export default Roadmap;
