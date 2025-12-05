import Wishlist from '../models/Wishlist.js';

// Add to wishlist: /api/wishlist/add
export const addToWishlist = async (req, res) => {
    try {
        const { productId } = req.body;
        const userId = req.userId;

        if (!productId) {
            return res.status(400).json({ message: 'Product ID is required' });
        }

        let wishlist = await Wishlist.findOne({ userId });

        if (!wishlist) {
            wishlist = await Wishlist.create({ userId, products: [productId] });
        } else {
            if (wishlist.products.includes(productId)) {
                return res.status(400).json({ message: 'Product already in wishlist' });
            }
            wishlist.products.push(productId);
            await wishlist.save();
        }

        res.status(200).json({ success: true, message: 'Added to wishlist', wishlist });
    } catch (error) {
        res.status(500).json({ message: 'Error adding to wishlist', error: error.message });
    }
};

// Remove from wishlist: /api/wishlist/remove
export const removeFromWishlist = async (req, res) => {
    try {
        const { productId } = req.body;
        const userId = req.userId;

        if (!productId) {
            return res.status(400).json({ message: 'Product ID is required' });
        }

        const wishlist = await Wishlist.findOne({ userId });

        if (!wishlist) {
            return res.status(404).json({ message: 'Wishlist not found' });
        }

        wishlist.products = wishlist.products.filter(
            id => id.toString() !== productId
        );
        await wishlist.save();

        res.status(200).json({ success: true, message: 'Removed from wishlist', wishlist });
    } catch (error) {
        res.status(500).json({ message: 'Error removing from wishlist', error: error.message });
    }
};

// Get wishlist: /api/wishlist/get
export const getWishlist = async (req, res) => {
    try {
        const userId = req.userId;
        const wishlist = await Wishlist.findOne({ userId }).populate('products');

        if (!wishlist) {
            return res.status(200).json({ success: true, products: [] });
        }

        res.status(200).json({ success: true, products: wishlist.products });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching wishlist', error: error.message });
    }
};

