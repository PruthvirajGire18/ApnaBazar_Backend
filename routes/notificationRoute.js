import express from 'express';
import authUser from '../middlewares/authUser.js';
import { getNotifications, markNotificationRead, markAllNotificationsRead } from '../controllers/notificationController.js';

const notificationRouter = express.Router();

notificationRouter.get('/get', authUser, getNotifications);
notificationRouter.post('/read/:id', authUser, markNotificationRead);
notificationRouter.post('/read-all', authUser, markAllNotificationsRead);

export default notificationRouter;

