import { Response } from 'express';
import mongoose from 'mongoose';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { ActivityLog } from '../models/ActivityLog.js';
import { sendSuccess, sendError } from '../utils/response.js';

export async function getWorkspaceActivity(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { workspaceId } = req.params;
    const limit = parseInt(req.query.limit as string, 10) || 25;

    const activities = await ActivityLog.find({ workspaceId })
      .populate('actorId', 'name email avatarUrl')
      .populate('projectId', 'name key')
      .populate('taskId', 'title taskNumber')
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    sendSuccess(res, activities);
  } catch (error) {
    sendError(res, 'Failed to fetch workspace activity', 500);
  }
}

export async function getProjectActivity(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { projectId } = req.params;
    const limit = parseInt(req.query.limit as string, 10) || 30;

    const activities = await ActivityLog.find({ projectId })
      .populate('actorId', 'name email avatarUrl')
      .populate('taskId', 'title taskNumber')
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    sendSuccess(res, activities);
  } catch (error) {
    sendError(res, 'Failed to fetch project activity', 500);
  }
}

export async function getTaskActivity(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { taskId } = req.params;

    const activities = await ActivityLog.find({ taskId })
      .populate('actorId', 'name email avatarUrl')
      .sort({ createdAt: -1 })
      .limit(30)
      .lean();

    sendSuccess(res, activities);
  } catch (error) {
    sendError(res, 'Failed to fetch task activity', 500);
  }
}
