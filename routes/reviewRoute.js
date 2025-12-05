import express from 'express';
import authUser from '../middlewares/authUser.js';
import { addReview, getProductReviews } from '../controllers/reviewController.js';

const reviewRouter = express.Router();

reviewRouter.post('/add', authUser, addReview);
reviewRouter.get('/product/:productId', getProductReviews);

export default reviewRouter;

