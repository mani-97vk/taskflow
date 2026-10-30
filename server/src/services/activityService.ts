import mongoose from 'mongoose';
import { ActivityLog } from '../models/ActivityLog.js';
import { emitToProject, emitToWorkspace } from '../sockets/socketHandler.js';

interface LogActivityParams {
  workspaceId: mongoose.Types.ObjectId | string;
  projectId?: mongoose.Types.ObjectId | string | null;
  taskId?: mongoose.Types.ObjectId | string | null;
  actorId: mongoose.Types.ObjectId | string;
  action: string;
  details?: Record<string, any>;
}

export async function logActivity(params: LogActivityParams) {
  try {
    const activity = await ActivityLog.create({
      workspaceId: params.workspaceId,
      projectId: params.projectId || null,
      taskId: params.taskId || null,
      actorId: params.actorId,
      action: params.action,
      details: params.details || {},
    });

    const populated = await ActivityLog.findById(activity._id)
      .populate('actorId', 'name email avatarUrl')
      .populate('taskId', 'title taskNumber')
      .populate('projectId', 'name key');

    // Real-time broadcast
    if (params.projectId) {
      emitToProject(params.projectId.toString(), 'activity:new', populated);
    }
    emitToWorkspace(params.workspaceId.toString(), 'activity:new', populated);

    return populated;
  } catch (error) {
    console.error('Failed to log activity:', error);
  }
}
