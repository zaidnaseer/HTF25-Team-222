import mongoose from 'mongoose';

const sessionSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    description: String,
    trainer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    learner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    learnerHub: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'LearnerHub'
    },
    type: {
        type: String,
        enum: ['one-on-one', 'group'],
        required: true
    },
    scheduledAt: {
        type: Date,
        required: true
    },
    duration: {
        type: Number, // in minutes
        required: true
    },
    status: {
        type: String,
        enum: ['scheduled', 'ongoing', 'completed', 'cancelled'],
        default: 'scheduled'
    },
    meetingLink: String, // Zoom meeting link
    price: {
        type: Number,
        default: 0
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'paid', 'refunded'],
        default: 'pending'
    },
    // For group sessions
    participants: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        joinedAt: Date
    }],
    maxParticipants: Number,
    // Session materials
    materials: [{
        title: String,
        type: String,
        url: String
    }],
    // Post-session
    notes: String,
    recordingUrl: String,
    completedAt: Date
}, {
    timestamps: true
});

const Session = mongoose.model('Session', sessionSchema);

export default Session;
