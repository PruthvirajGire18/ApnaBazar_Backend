import Admin from '../models/Admin.js';
import User from '../models/User.js';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Admin Login: /api/admin/login
export const adminLogin = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        const admin = await Admin.findOne({ email, isActive: true });
        if (!admin) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const isPasswordValid = await bcrypt.compare(password, admin.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { adminId: admin._id, role: admin.role },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.cookie('adminToken', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        res.status(200).json({
            success: true,
            message: 'Login successful',
            admin: {
                id: admin._id,
                name: admin.name,
                email: admin.email,
                role: admin.role
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Error logging in', error: error.message });
    }
};

// Get Dashboard Stats: /api/admin/stats
export const getDashboardStats = async (req, res) => {
    try {
        const totalUsers = await User.countDocuments({ role: 'user' });
        const totalSellers = await User.countDocuments({ role: 'seller' });
        const totalProducts = await Product.countDocuments();
        const totalOrders = await Order.countDocuments();

        // Get orders by status
        const ordersByStatus = await Order.aggregate([
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            }
        ]);

        // Get revenue stats
        const revenueStats = await Order.aggregate([
            {
                $match: {
                    status: { $ne: 'Cancelled' },
                    isPaid: true
                }
            },
            {
                $group: {
                    _id: null,
                    totalRevenue: { $sum: '$amount' },
                    totalOrders: { $sum: 1 },
                    averageOrderValue: { $avg: '$amount' }
                }
            }
        ]);

        // Get recent orders
        const recentOrders = await Order.find()
            .populate('userId', 'name email')
            .sort({ createdAt: -1 })
            .limit(10)
            .lean();

        // Get top selling products
        const topProducts = await Order.aggregate([
            { $unwind: '$items' },
            {
                $group: {
                    _id: '$items.product',
                    totalQuantity: { $sum: '$items.quantity' }
                }
            },
            { $sort: { totalQuantity: -1 } },
            { $limit: 10 },
            {
                $lookup: {
                    from: 'products',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'product'
                }
            },
            { $unwind: '$product' },
            {
                $project: {
                    productName: '$product.name',
                    totalQuantity: 1,
                    productId: '$_id'
                }
            }
        ]);

        res.status(200).json({
            success: true,
            stats: {
                users: {
                    total: totalUsers,
                    sellers: totalSellers
                },
                products: {
                    total: totalProducts
                },
                orders: {
                    total: totalOrders,
                    byStatus: ordersByStatus
                },
                revenue: revenueStats[0] || {
                    totalRevenue: 0,
                    totalOrders: 0,
                    averageOrderValue: 0
                },
                topProducts,
                recentOrders
            }
        });
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        res.status(500).json({ message: 'Error fetching stats', error: error.message });
    }
};

// Get All Users: /api/admin/users
export const getAllUsers = async (req, res) => {
    try {
        const { page = 1, limit = 20, role } = req.query;
        const query = role ? { role } : {};

        const users = await User.find(query)
            .select('-password')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .lean();

        const total = await User.countDocuments(query);

        res.status(200).json({
            success: true,
            users,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            total
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching users', error: error.message });
    }
};

// Get All Orders: /api/admin/orders
export const getAllOrdersAdmin = async (req, res) => {
    try {
        const { page = 1, limit = 20, status } = req.query;
        const query = status ? { status } : {};

        const orders = await Order.find(query)
            .populate('userId', 'name email')
            .populate('items.product', 'name images price offerPrice')
            .populate('address')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .lean();

        const total = await Order.countDocuments(query);

        res.status(200).json({
            success: true,
            orders,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            total
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching orders', error: error.message });
    }
};

// Update User Status: /api/admin/users/:userId
export const updateUserStatus = async (req, res) => {
    try {
        const { userId } = req.params;
        const { isActive } = req.body;

        const user = await User.findByIdAndUpdate(
            userId,
            { isActive },
            { new: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json({
            success: true,
            message: 'User status updated',
            user
        });
    } catch (error) {
        res.status(500).json({ message: 'Error updating user', error: error.message });
    }
};

