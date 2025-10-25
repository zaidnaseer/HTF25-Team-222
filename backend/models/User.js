import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a name'],
        trim: true
    },
    email: {
        type: String,
        required: [true, 'Please add an email'],
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: [true, 'Please add a password'],
        minlength: 6,
        select: false
    },
    avatar: {
        type: String,
        default: 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'
    },
    bio: {
        type: String,
        maxlength: 500
    },
    role: {
        type: String,
        enum: ['learner', 'trainer', 'both'],
        default: 'learner'
    },
    // Skills they can teach
    skillsToTeach: [{
        skill: String,
        level: {
            type: String,
            enum: ['beginner', 'intermediate', 'advanced', 'expert']
        }
    }],
    // Skills they want to learn
    skillsToLearn: [String],
    // Trainer specific fields
    isTrainer: {
        type: Boolean,
        default: false
    },
    trainerProfile: {
        domain: [String],
        experience: Number,
        pricing: {
            hourlyRate: Number,
            programs: [{
                title: String,
                description: String,
                duration: String,
                price: Number,
                type: {
                    type: String,
                    enum: ['one-on-one', 'group', 'learner-hub']
                }
            }]
        },
        availability: [{
            day: String,
            slots: [String]
        }],
        totalStudents: {
            type: Number,
            default: 0
        },
        totalSessions: {
            type: Number,
            default: 0
        }
    },
    // Gamification
    points: {
        type: Number,
        default: 0
    },
    badges: [{
        name: String,
        icon: String,
        earnedAt: {
            type: Date,
            default: Date.now
        }
    }],
    level: {
        type: Number,
        default: 1
    },
    // Social
    learnerHubs: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'LearnerHub'
    }],
    followers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    following: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    // Ratings
    averageRating: {
        type: Number,
        default: 0
    },
    totalRatings: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Method to compare password
userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);

export default User;
