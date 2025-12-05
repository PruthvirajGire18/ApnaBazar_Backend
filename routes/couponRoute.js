import express from 'express';
import authUser from '../middlewares/authUser.js';
import authSeller from '../middlewares/authSeller.js';
import { applyCoupon, getActiveCoupons, createCoupon } from '../controllers/couponController.js';

const couponRouter = express.Router();

couponRouter.post('/apply', authUser, applyCoupon);
couponRouter.get('/list', getActiveCoupons);
couponRouter.post('/create', authSeller, createCoupon);

export default couponRouter;

