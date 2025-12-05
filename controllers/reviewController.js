import mongoose from 'mongoose';
import Review from '../models/Review.js';
import Product from '../models/Product.js';

// Add review: /api/review/add
export const addReview = async (req, res) => {
    try {
        const { productId, rating, comment } = req.body;
        const userId = req.userId;

        if (!productId || !rating) {
            return res.status(400).json({ message: 'Product ID and rating are required' });
        }

        if (rating < 1 || rating > 5) {
            return res.status(400).json({ message: 'Rating must be between 1 and 5' });
        }

        // Check if review already exists
        const existingReview = await Review.findOne({ userId, productId });
        if (existingReview) {
            return res.status(400).json({ message: 'You have already reviewed this product' });
        }

        const review = await Review.create({
            userId,
            productId,
            rating,
            comment: comment || ''
        });

        // Update product average rating
        await updateProductRating(productId);

        res.status(201).json({ success: true, message: 'Review added successfully', review });
    } catch (error) {
        res.status(500).json({ message: 'Error adding review', error: error.message });
    }
};

// Get reviews for a product: /api/review/product/:productId
export const getProductReviews = async (req, res) => {
    try {
        const { productId } = req.params;
        const reviews = await Review.find({ productId })
            .populate('userId', 'name email')
            .sort({ createdAt: -1 });

        const averageRating = await Review.aggregate([
            { $match: { productId: new mongoose.Types.ObjectId(productId) } },
            { $group: { _id: null, avgRating: { $avg: '$rating' }, count: { $sum: 1 } } }
        ]);

        res.status(200).json({
            success: true,
            reviews,
            averageRating: averageRating[0]?.avgRating || 0,
            totalReviews: averageRating[0]?.count || 0
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching reviews', error: error.message });
    }
};

// Update product rating helper
const updateProductRating = async (productId) => {
    const ratingData = await Review.aggregate([
        { $match: { productId: new mongoose.Types.ObjectId(productId) } },
        { $group: { _id: null, avgRating: { $avg: '$rating' }, count: { $sum: 1 } } }
    ]);

    if (ratingData.length > 0) {
        await Product.findByIdAndUpdate(productId, {
            averageRating: Math.round(ratingData[0].avgRating * 10) / 10,
            totalReviews: ratingData[0].count
        });
    }
};
