import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
    learnerHub: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'LearnerHub',
        required: true
    },
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    content: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['text', 'image', 'file', 'link'],
        default: 'text'
    },
    fileUrl: String,
    // For replies
    replyTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Message'
    },
    // Reactions
    reactions: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        emoji: String
    }],
    // Read receipts
    readBy: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        readAt: Date
    }]
}, {
    timestamps: true
});

const Message = mongoose.model('Message', messageSchema);

export default Message;
