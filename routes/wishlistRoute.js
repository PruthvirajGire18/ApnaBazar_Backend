import express from 'express';
import authUser from '../middlewares/authUser.js';
import { addToWishlist, removeFromWishlist, getWishlist } from '../controllers/wishlistController.js';

const wishlistRouter = express.Router();

wishlistRouter.post('/add', authUser, addToWishlist);
wishlistRouter.post('/remove', authUser, removeFromWishlist);
wishlistRouter.get('/get', authUser, getWishlist);

export default wishlistRouter;

