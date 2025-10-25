import mongoose from 'mongoose';

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
    isTemplate: {
        type: Boolean,
        default: false // true for pre-built roadmaps
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    learnerHub: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'LearnerHub'
    },
    estimatedDuration: String, // e.g., "3 months", "6 weeks"
    milestones: [{
        title: {
            type: String,
            required: true
        },
        description: String,
        order: Number,
        tasks: [{
            title: String,
            description: String,
            resources: [{
                title: String,
                url: String,
                type: String
            }],
            completed: {
                type: Boolean,
                default: false
            }
        }],
        completed: {
            type: Boolean,
            default: false
        }
    }],
    tags: [String],
    usedBy: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

const Roadmap = mongoose.model('Roadmap', roadmapSchema);

export default Roadmap;
