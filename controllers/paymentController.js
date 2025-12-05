import Razorpay from 'razorpay';
import crypto from 'crypto';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import Address from '../models/Address.js';
import mongoose from 'mongoose';

// Initialize Razorpay
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_1234567890',
    key_secret: process.env.RAZORPAY_KEY_SECRET || 'test_secret_key'
});

// Create Razorpay order: /api/payment/create-order
export const createRazorpayOrder = async (req, res) => {
    try {
        const { items, address, deliveryTimeSlot, isExpressDelivery, couponCode, discount } = req.body;
        const userId = req.userId;

        if (!userId) {
            return res.status(401).json({ message: 'User not authenticated' });
        }

        if (!items || items.length === 0) {
            return res.status(400).json({ message: 'Cart is empty' });
        }

        if (!address) {
            return res.status(400).json({ message: 'Please select a delivery address' });
        }

        // Calculate order amount
        let subtotal = 0;
        for (const item of items) {
            const product = await Product.findById(item.product);
            if (!product) {
                return res.status(400).json({ message: `Product ${item.product} not found` });
            }
            subtotal += product.offerPrice * item.quantity;
        }

        const tax = Math.floor(subtotal * 0.02);
        let deliveryFee = 0;
        if (subtotal < 500) {
            deliveryFee = isExpressDelivery ? 50 : 30;
        } else if (isExpressDelivery) {
            deliveryFee = 30;
        }

        const finalDiscount = Math.min(discount || 0, subtotal);
        const amount = Math.max(0, Math.floor((subtotal + tax + deliveryFee - finalDiscount) * 100)); // Amount in paise

        // Create Razorpay order
        const razorpayOrder = await razorpay.orders.create({
            amount: amount,
            currency: 'INR',
            receipt: `order_${Date.now()}`,
            notes: {
                userId: userId.toString(),
                items: JSON.stringify(items),
                address: address,
                deliveryTimeSlot: deliveryTimeSlot || null,
                isExpressDelivery: isExpressDelivery || false,
                couponCode: couponCode || null,
                discount: finalDiscount
            }
        });

        res.status(200).json({
            success: true,
            orderId: razorpayOrder.id,
            amount: razorpayOrder.amount,
            currency: razorpayOrder.currency,
            key: process.env.RAZORPAY_KEY_ID || 'rzp_test_1234567890'
        });
    } catch (error) {
        console.error('Razorpay order creation error:', error);
        res.status(500).json({ message: 'Error creating payment order', error: error.message });
    }
};

// Verify payment and create order: /api/payment/verify
export const verifyPayment = async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, items, address, deliveryTimeSlot, isExpressDelivery, couponCode, discount } = req.body;
        const userId = req.userId;

        if (!userId) {
            return res.status(401).json({ message: 'User not authenticated' });
        }

        // Verify signature
        const text = `${razorpay_order_id}|${razorpay_payment_id}`;
        const generated_signature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'test_secret_key')
            .update(text)
            .digest('hex');

        if (generated_signature !== razorpay_signature) {
            return res.status(400).json({ message: 'Payment verification failed' });
        }

        // Calculate order details
        let subtotal = 0;
        for (const item of items) {
            const product = await Product.findById(item.product);
            if (!product) {
                return res.status(400).json({ message: `Product ${item.product} not found` });
            }
            subtotal += product.offerPrice * item.quantity;
        }

        const tax = Math.floor(subtotal * 0.02);
        let deliveryFee = 0;
        if (subtotal < 500) {
            deliveryFee = isExpressDelivery ? 50 : 30;
        } else if (isExpressDelivery) {
            deliveryFee = 30;
        }

        const finalDiscount = Math.min(discount || 0, subtotal);
        const amount = Math.max(0, subtotal + tax + deliveryFee - finalDiscount);

        // Generate tracking number
        const trackingNumber = 'APNA' + Date.now().toString().slice(-8);

        // Calculate estimated delivery
        const estimatedDelivery = new Date();
        if (isExpressDelivery) {
            estimatedDelivery.setHours(estimatedDelivery.getHours() + 2);
        } else {
            estimatedDelivery.setDate(estimatedDelivery.getDate() + 1);
            estimatedDelivery.setHours(10, 0, 0, 0);
            if (deliveryTimeSlot) {
                const [hours, minutes] = deliveryTimeSlot.split(':');
                if (hours && minutes) {
                    estimatedDelivery.setHours(parseInt(hours), parseInt(minutes || 0), 0, 0);
                }
            }
        }

        const statusHistory = [{
            status: 'Order Placed',
            timestamp: new Date(),
            message: 'Your order has been placed successfully'
        }];

        // Validate address
        let addressId = address;
        if (typeof address === 'string') {
            if (!mongoose.Types.ObjectId.isValid(address)) {
                return res.status(400).json({ message: 'Invalid address ID format' });
            }
            addressId = address;
        } else if (address && address._id) {
            addressId = address._id;
        } else {
            return res.status(400).json({ message: 'Invalid address provided' });
        }

        const addressDoc = await Address.findOne({ _id: addressId, userId: userId });
        if (!addressDoc) {
            return res.status(404).json({ message: 'Address not found or does not belong to user' });
        }

        // Create order
        const order = await Order.create({
            userId,
            items,
            subtotal,
            tax,
            deliveryFee,
            discount: finalDiscount,
            couponCode: couponCode || null,
            amount: Math.max(0, amount),
            address: addressId,
            paymentType: 'Online',
            paymentIntentId: razorpay_payment_id,
            isPaid: true,
            deliveryTimeSlot: deliveryTimeSlot || null,
            isExpressDelivery: isExpressDelivery || false,
            estimatedDelivery,
            trackingNumber,
            statusHistory
        });

        res.status(201).json({
            success: true,
            message: 'Order placed successfully',
            orderId: order._id,
            trackingNumber: order.trackingNumber,
            paymentId: razorpay_payment_id
        });
    } catch (error) {
        console.error('Payment verification error:', error);
        res.status(500).json({ message: 'Error verifying payment', error: error.message });
    }
};

// Get payment status: /api/payment/status/:orderId
export const getPaymentStatus = async (req, res) => {
    try {
        const { orderId } = req.params;
        const userId = req.userId;

        const order = await Order.findOne({ _id: orderId, userId });
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        res.status(200).json({
            success: true,
            isPaid: order.isPaid,
            paymentType: order.paymentType,
            paymentIntentId: order.paymentIntentId
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching payment status', error: error.message });
    }
};

