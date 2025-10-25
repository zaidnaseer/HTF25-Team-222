import mongoose from 'mongoose';

const learnerHubSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    creator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    category: {
        type: String,
        required: true
    },
    tags: [String],
    coverImage: {
        type: String,
        default: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800'
    },
    privacyType: {
        type: String,
        enum: ['public', 'request-to-join', 'closed'],
        default: 'public'
    },
    members: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        role: {
            type: String,
            enum: ['admin', 'moderator', 'member'],
            default: 'member'
        },
        joinedAt: {
            type: Date,
            default: Date.now
        }
    }],
    pendingRequests: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        message: String,
        requestedAt: {
            type: Date,
            default: Date.now
        }
    }],
    // Gamification settings
    gamificationEnabled: {
        type: Boolean,
        default: true
    },
    leaderboard: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        points: {
            type: Number,
            default: 0
        }
    }],
    // Roadmap
    roadmap: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Roadmap'
    },
    // Activities and events
    upcomingEvents: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Activity'
    }],
    // Industry connection
    industryMentors: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    resources: [{
        title: String,
        type: {
            type: String,
            enum: ['document', 'video', 'link', 'problem-statement']
        },
        url: String,
        uploadedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        uploadedAt: {
            type: Date,
            default: Date.now
        }
    }],
    // Stats
    totalMembers: {
        type: Number,
        default: 0
    },
    activeMembers: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

// Update total members before saving
learnerHubSchema.pre('save', function (next) {
    this.totalMembers = this.members.length;
    next();
});

const LearnerHub = mongoose.model('LearnerHub', learnerHubSchema);

export default LearnerHub;
