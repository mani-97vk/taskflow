import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { Notification } from '../models/Notification.js';
import { sendSuccess, sendError } from '../utils/response.js';

export async function listNotifications(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = req.user!._id;
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 20;
    const skip = (page - 1) * limit;

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find({ recipientId: userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Notification.countDocuments({ recipientId: userId }),
      Notification.countDocuments({ recipientId: userId, read: false }),
    ]);

    sendSuccess(
      res,
      {
        notifications,
        unreadCount,
      },
      'Notifications retrieved',
      200,
      {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      }
    );
  } catch (error) {
    sendError(res, 'Failed to fetch notifications', 500);
  }
}

export async function markAsRead(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { notificationId } = req.params;
    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, recipientId: req.user!._id },
      { read: true },
      { new: true }
    );

    if (!notification) {
      sendError(res, 'Notification not found', 404);
      return;
    }

    sendSuccess(res, notification, 'Notification marked as read');
  } catch (error) {
    sendError(res, 'Failed to mark notification as read', 500);
  }
}

export async function markAllAsRead(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    await Notification.updateMany({ recipientId: req.user!._id, read: false }, { read: true });
    sendSuccess(res, null, 'All notifications marked as read');
  } catch (error) {
    sendError(res, 'Failed to update notifications', 500);
  }
}
