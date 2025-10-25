import mongoose from 'mongoose';

const ratingSchema = new mongoose.Schema({
    trainer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    learner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    session: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Session',
        required: true
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    review: {
        type: String,
        maxlength: 500
    },
    categories: {
        knowledge: {
            type: Number,
            min: 1,
            max: 5
        },
        communication: {
            type: Number,
            min: 1,
            max: 5
        },
        patience: {
            type: Number,
            min: 1,
            max: 5
        },
        helpfulness: {
            type: Number,
            min: 1,
            max: 5
        }
    }
}, {
    timestamps: true
});

// Prevent duplicate ratings for same session
ratingSchema.index({ learner: 1, session: 1 }, { unique: true });

const Rating = mongoose.model('Rating', ratingSchema);

export default Rating;
