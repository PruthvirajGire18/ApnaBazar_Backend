import express from 'express';
import { isAuth, register, login, logout, googleLogin, sendOTP, verifyOTP, getLoyaltyPoints } from '../controllers/userController.js';
import authUser from '../middlewares/authUser.js';
const userRouter = express.Router();
userRouter.post('/register', register);
userRouter.post('/login', login);
userRouter.post('/google-login', googleLogin);
userRouter.post('/send-otp', sendOTP);
userRouter.post('/verify-otp', verifyOTP);
userRouter.get("/is-auth", authUser, isAuth);
userRouter.get('/loyalty-points', authUser, getLoyaltyPoints);
userRouter.get('/logout', logout);

export default userRouter;