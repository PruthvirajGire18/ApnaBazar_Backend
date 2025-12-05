import Notification from '../models/Notification.js';
import nodemailer from 'nodemailer';

// Email transporter configuration
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: false,
    auth: {
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || ''
    }
});

// Create notification
export const createNotification = async (userId, type, title, message, orderId = null, actionUrl = null) => {
    try {
        const notification = await Notification.create({
            userId,
            type,
            title,
            message,
            orderId,
            actionUrl
        });
        return notification;
    } catch (error) {
        console.error('Error creating notification:', error);
        return null;
    }
};

// Send email notification
export const sendEmailNotification = async (email, subject, htmlContent) => {
    try {
        if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
            console.log('Email not configured. Skipping email send.');
            return false;
        }

        await transporter.sendMail({
            from: process.env.SMTP_USER,
            to: email,
            subject: subject,
            html: htmlContent
        });
        return true;
    } catch (error) {
        console.error('Error sending email:', error);
        return false;
    }
};

// Send SMS notification (placeholder - integrate with Twilio or similar)
export const sendSMSNotification = async (phone, message) => {
    try {
        // Placeholder for SMS integration
        // In production, integrate with Twilio, AWS SNS, or similar service
        console.log(`SMS to ${phone}: ${message}`);
        return true;
    } catch (error) {
        console.error('Error sending SMS:', error);
        return false;
    }
};

// Get user notifications
export const getUserNotifications = async (userId, limit = 20) => {
    try {
        const notifications = await Notification.find({ userId })
            .sort({ createdAt: -1 })
            .limit(limit);
        return notifications;
    } catch (error) {
        console.error('Error fetching notifications:', error);
        return [];
    }
};

// Mark notification as read
export const markAsRead = async (notificationId, userId) => {
    try {
        const notification = await Notification.findOneAndUpdate(
            { _id: notificationId, userId },
            { isRead: true, readAt: new Date() },
            { new: true }
        );
        return notification;
    } catch (error) {
        console.error('Error marking notification as read:', error);
        return null;
    }
};

// Mark all as read
export const markAllAsRead = async (userId) => {
    try {
        await Notification.updateMany(
            { userId, isRead: false },
            { isRead: true, readAt: new Date() }
        );
        return true;
    } catch (error) {
        console.error('Error marking all as read:', error);
        return false;
    }
};

