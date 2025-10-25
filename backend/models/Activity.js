import mongoose from 'mongoose';

const activitySchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    description: String,
    type: {
        type: String,
        enum: ['contest', 'quiz', 'challenge', 'workshop', 'webinar', 'meeting'],
        required: true
    },
    learnerHub: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'LearnerHub',
        required: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    startDate: {
        type: Date,
        required: true
    },
    endDate: Date,
    duration: Number, // in minutes for meetings/workshops
    // For quizzes/contests
    questions: [{
        question: String,
        options: [String],
        correctAnswer: Number,
        points: {
            type: Number,
            default: 10
        }
    }],
    // Participants and results
    participants: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        score: {
            type: Number,
            default: 0
        },
        completedAt: Date,
        answers: [Number]
    }],
    // For meetings/workshops
    meetingLink: String,
    maxParticipants: Number,
    // Prize/rewards
    rewards: {
        winner: {
            points: Number,
            badge: String
        },
        participant: {
            points: Number
        }
    },
    status: {
        type: String,
        enum: ['upcoming', 'ongoing', 'completed', 'cancelled'],
        default: 'upcoming'
    }
}, {
    timestamps: true
});

const Activity = mongoose.model('Activity', activitySchema);

export default Activity;
