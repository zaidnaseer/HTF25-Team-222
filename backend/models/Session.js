import mongoose from 'mongoose';

const sessionSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    description: String,
    
    // Participants
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
    
    // Session type
    type: {
        type: String,
        enum: ['one-on-one', 'group', 'solo'],
        default: 'one-on-one'
    },
    
    // Scheduling
    scheduledAt: {
        type: Date,
        required: true
    },
    duration: {
        type: Number,
        required: true
    },
    
    // NEW: Request handling fields
    requestedSlot: Date, // Original requested time
    status: {
        type: String,
        enum: ['pending', 'scheduled', 'ongoing', 'completed', 'cancelled', 'rejected'],
        default: 'pending' // Changed default to pending for request-approval flow
    },
    rejectionReason: String,
    suggestedAlternatives: [Date],
    
    // Meeting
    meetingLink: String,
    
    // Payment
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
        joinedAt: Date,
        attended: Boolean
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
    completedAt: Date,
    
    // NEW: Automation tracking
    remindersSent: [{
        type: { type: String },
        sentAt: Date
    }]
}, {
    timestamps: true
});

// Index for faster queries
sessionSchema.index({ trainer: 1, status: 1 });
sessionSchema.index({ learner: 1, status: 1 });
sessionSchema.index({ scheduledAt: 1 });

const Session = mongoose.model('Session', sessionSchema);
export default Session;
