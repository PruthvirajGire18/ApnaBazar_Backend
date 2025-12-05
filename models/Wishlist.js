import mongoose from 'mongoose';

const wishlistSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'user',
        unique: true
    },
    products: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'product'
    }]
}, { timestamps: true });

const Wishlist = mongoose.models.wishlist || mongoose.model('wishlist', wishlistSchema);

export default Wishlist;

