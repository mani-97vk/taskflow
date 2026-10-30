import { Response } from 'express';
import mongoose from 'mongoose';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { Comment } from '../models/Comment.js';
import { Task } from '../models/Task.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { logActivity } from '../services/activityService.js';
import { createNotification } from '../services/notificationService.js';
import { emitToProject } from '../sockets/socketHandler.js';

export async function getTaskComments(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { taskId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(taskId)) {
      sendError(res, 'Invalid task ID', 400);
      return;
    }

    const comments = await Comment.find({ taskId })
      .populate('authorId', 'name email avatarUrl')
      .populate('parentCommentId', 'content authorId')
      .sort({ createdAt: 1 })
      .lean();

    sendSuccess(res, comments);
  } catch (error) {
    sendError(res, 'Failed to fetch comments', 500);
  }
}

export async function createComment(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { taskId } = req.params;
    const { content, parentCommentId } = req.body;

    const task = await Task.findById(taskId);
    if (!task) {
      sendError(res, 'Task not found', 404);
      return;
    }

    const comment = await Comment.create({
      taskId,
      workspaceId: task.workspaceId,
      projectId: task.projectId,
      authorId: req.user!._id,
      content,
      parentCommentId: parentCommentId || null,
    });

    const populated = await Comment.findById(comment._id)
      .populate('authorId', 'name email avatarUrl')
      .populate('parentCommentId', 'content authorId');

    await logActivity({
      workspaceId: task.workspaceId,
      projectId: task.projectId,
      taskId: task._id,
      actorId: req.user!._id,
      action: 'commented on task',
      details: { commentPreview: content.slice(0, 50) },
    });

    // Notify assignees and creator
    const recipients = new Set<string>();
    task.assignees.forEach((a) => recipients.add(a.toString()));
    recipients.add(task.creatorId.toString());
    recipients.delete(req.user!._id.toString());

    for (const recipientId of recipients) {
      await createNotification({
        recipientId,
        workspaceId: task.workspaceId,
        projectId: task.projectId,
        taskId: task._id,
        type: 'comment_added',
        title: 'New comment on task',
        message: `${req.user!.name} commented: "${content.slice(0, 80)}"`,
        actionUrl: `/projects/${task.projectId}/tasks/${task._id}`,
      });
    }

    emitToProject(task.projectId.toString(), 'comment:created', populated);

    sendSuccess(res, populated, 'Comment posted', 201);
  } catch (error) {
    sendError(res, 'Failed to post comment', 500);
  }
}

export async function updateComment(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { commentId } = req.params;
    const { content } = req.body;

    const comment = await Comment.findById(commentId);
    if (!comment) {
      sendError(res, 'Comment not found', 404);
      return;
    }

    if (comment.authorId.toString() !== req.user!._id.toString()) {
      sendError(res, 'You can only edit your own comments', 403);
      return;
    }

    comment.content = content;
    comment.isEdited = true;
    await comment.save();

    const populated = await Comment.findById(comment._id)
      .populate('authorId', 'name email avatarUrl');

    emitToProject(comment.projectId.toString(), 'comment:updated', populated);

    sendSuccess(res, populated, 'Comment updated');
  } catch (error) {
    sendError(res, 'Failed to update comment', 500);
  }
}

export async function deleteComment(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { commentId } = req.params;

    const comment = await Comment.findById(commentId);
    if (!comment) {
      sendError(res, 'Comment not found', 404);
      return;
    }

    if (comment.authorId.toString() !== req.user!._id.toString()) {
      sendError(res, 'You can only delete your own comments', 403);
      return;
    }

    await Comment.findByIdAndDelete(commentId);

    emitToProject(comment.projectId.toString(), 'comment:deleted', {
      commentId,
      taskId: comment.taskId,
    });

    sendSuccess(res, null, 'Comment deleted');
  } catch (error) {
    sendError(res, 'Failed to delete comment', 500);
  }
}
