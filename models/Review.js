import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'user'
    },
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'product'
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    comment: {
        type: String,
        default: ''
    },
    helpful: {
        type: Number,
        default: 0
    }
}, { timestamps: true });

// Ensure one review per user per product
reviewSchema.index({ userId: 1, productId: 1 }, { unique: true });

const Review = mongoose.models.review || mongoose.model('review', reviewSchema);

export default Review;

