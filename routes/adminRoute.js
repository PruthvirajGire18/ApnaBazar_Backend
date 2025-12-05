import express from 'express';
import authAdmin from '../middlewares/authAdmin.js';
import { adminLogin, getDashboardStats, getAllUsers, getAllOrdersAdmin, updateUserStatus } from '../controllers/adminController.js';

const adminRouter = express.Router();

adminRouter.post('/login', adminLogin);
adminRouter.get('/stats', authAdmin, getDashboardStats);
adminRouter.get('/users', authAdmin, getAllUsers);
adminRouter.get('/orders', authAdmin, getAllOrdersAdmin);
adminRouter.put('/users/:userId', authAdmin, updateUserStatus);

export default adminRouter;

