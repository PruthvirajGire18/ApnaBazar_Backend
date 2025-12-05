import express from 'express';
import authUser from '../middlewares/authUser.js';
import { createRazorpayOrder, verifyPayment, getPaymentStatus } from '../controllers/paymentController.js';

const paymentRouter = express.Router();

paymentRouter.post('/create-order', authUser, createRazorpayOrder);
paymentRouter.post('/verify', authUser, verifyPayment);
paymentRouter.get('/status/:orderId', authUser, getPaymentStatus);

export default paymentRouter;

