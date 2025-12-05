import { getUserNotifications, markAsRead, markAllAsRead, createNotification } from '../services/notificationService.js';

// Get user notifications: /api/notification/get
export const getNotifications = async (req, res) => {
    try {
        const userId = req.userId;
        const { limit = 20 } = req.query;

        const notifications = await getUserNotifications(userId, parseInt(limit));

        res.status(200).json({
            success: true,
            notifications,
            unreadCount: notifications.filter(n => !n.isRead).length
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching notifications', error: error.message });
    }
};

// Mark notification as read: /api/notification/read/:id
export const markNotificationRead = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.userId;

        const notification = await markAsRead(id, userId);
        if (!notification) {
            return res.status(404).json({ message: 'Notification not found' });
        }

        res.status(200).json({
            success: true,
            message: 'Notification marked as read',
            notification
        });
    } catch (error) {
        res.status(500).json({ message: 'Error updating notification', error: error.message });
    }
};

// Mark all as read: /api/notification/read-all
export const markAllNotificationsRead = async (req, res) => {
    try {
        const userId = req.userId;

        await markAllAsRead(userId);

        res.status(200).json({
            success: true,
            message: 'All notifications marked as read'
        });
    } catch (error) {
        res.status(500).json({ message: 'Error updating notifications', error: error.message });
    }
};

