import mongoose from 'mongoose';
import { Notification } from '../models/Notification.js';
import { NotificationType } from '../config/constants.js';
import { emitToUser } from '../sockets/socketHandler.js';

interface CreateNotificationParams {
  recipientId: mongoose.Types.ObjectId | string;
  workspaceId: mongoose.Types.ObjectId | string;
  projectId?: mongoose.Types.ObjectId | string | null;
  taskId?: mongoose.Types.ObjectId | string | null;
  type: NotificationType;
  title: string;
  message: string;
  actionUrl?: string;
}

export async function createNotification(params: CreateNotificationParams) {
  try {
    const notification = await Notification.create({
      recipientId: params.recipientId,
      workspaceId: params.workspaceId,
      projectId: params.projectId || null,
      taskId: params.taskId || null,
      type: params.type,
      title: params.title,
      message: params.message,
      actionUrl: params.actionUrl || '',
      read: false,
    });

    // Send real-time notification to user's personal socket room
    emitToUser(params.recipientId.toString(), 'notification:new', notification);

    return notification;
  } catch (error) {
    console.error('Failed to create notification:', error);
  }
}
