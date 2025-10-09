import express from 'express';
import { register } from '../controllers/userController.js';
import { login } from '../controllers/userController.js';
const userRouter = express.Router();
userRouter.post('/register', register);
userRouter.post('/login', login);
export default userRouter;