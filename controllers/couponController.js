import Coupon from '../models/Coupon.js';

// Apply coupon: /api/coupon/apply
export const applyCoupon = async (req, res) => {
    try {
        const { code, orderValue } = req.body;
        const userId = req.userId;

        if (!code || !orderValue) {
            return res.status(400).json({ message: 'Coupon code and order value are required' });
        }

        const coupon = await Coupon.findOne({ code: code.toUpperCase() });

        if (!coupon) {
            return res.status(404).json({ message: 'Invalid coupon code' });
        }

        // Check if coupon is active
        if (!coupon.isActive) {
            return res.status(400).json({ message: 'Coupon is not active' });
        }

        // Check validity dates
        const now = new Date();
        if (now < coupon.validFrom || now > coupon.validUntil) {
            return res.status(400).json({ message: 'Coupon has expired' });
        }

        // Check minimum order value
        if (orderValue < coupon.minOrderValue) {
            return res.status(400).json({
                message: `Minimum order value of ${coupon.minOrderValue} required`
            });
        }

        // Check usage limit
        if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
            return res.status(400).json({ message: 'Coupon usage limit reached' });
        }

        // Calculate discount
        let discount = 0;
        if (coupon.discountType === 'percentage') {
            discount = (orderValue * coupon.discountValue) / 100;
            if (coupon.maxDiscount && discount > coupon.maxDiscount) {
                discount = coupon.maxDiscount;
            }
        } else {
            discount = coupon.discountValue;
        }

        res.status(200).json({
            success: true,
            discount: Math.floor(discount * 100) / 100,
            coupon: {
                code: coupon.code,
                discountType: coupon.discountType,
                description: coupon.description
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Error applying coupon', error: error.message });
    }
};

// Get all active coupons: /api/coupon/list
export const getActiveCoupons = async (req, res) => {
    try {
        const now = new Date();
        const coupons = await Coupon.find({
            isActive: true,
            validFrom: { $lte: now },
            validUntil: { $gte: now },
            $or: [
                { usageLimit: null },
                { $expr: { $lt: ['$usedCount', '$usageLimit'] } }
            ]
        }).sort({ discountValue: -1 });

        res.status(200).json({ success: true, coupons });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching coupons', error: error.message });
    }
};

// Create coupon (admin/seller): /api/coupon/create
export const createCoupon = async (req, res) => {
    try {
        const couponData = req.body;
        const coupon = await Coupon.create(couponData);
        res.status(201).json({ success: true, message: 'Coupon created successfully', coupon });
    } catch (error) {
        res.status(500).json({ message: 'Error creating coupon', error: error.message });
    }
};

