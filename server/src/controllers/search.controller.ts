import { Response } from 'express';
import mongoose from 'mongoose';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { Project } from '../models/Project.js';
import { Task } from '../models/Task.js';
import { WorkspaceMember } from '../models/WorkspaceMember.js';
import { sendSuccess, sendError } from '../utils/response.js';

export async function globalSearch(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { workspaceId, q } = req.query;

    if (!workspaceId || typeof workspaceId !== 'string') {
      sendError(res, 'workspaceId is required', 400);
      return;
    }

    if (!q || typeof q !== 'string' || q.trim().length === 0) {
      sendSuccess(res, { projects: [], tasks: [], members: [] });
      return;
    }

    const searchTerm = q.trim();
    const regex = new RegExp(searchTerm, 'i');

    const [projects, tasks, members] = await Promise.all([
      Project.find({
        workspaceId,
        isArchived: false,
        $or: [{ name: regex }, { key: regex }, { description: regex }],
      })
        .select('name key description status priority')
        .limit(10)
        .lean(),

      Task.find({
        workspaceId,
        isArchived: false,
        $or: [{ title: regex }, { description: regex }, { labels: regex }],
      })
        .populate('projectId', 'name key')
        .populate('assignees', 'name email avatarUrl')
        .select('title taskNumber priority status columnId projectId dueDate assignees')
        .limit(15)
        .lean(),

      WorkspaceMember.find({ workspaceId })
        .populate({
          path: 'userId',
          match: { $or: [{ name: regex }, { email: regex }] },
          select: 'name email avatarUrl',
        })
        .lean(),
    ]);

    const filteredMembers = members
      .filter((m) => m.userId)
      .map((m) => ({
        role: m.role,
        ...(m.userId as any),
      }));

    sendSuccess(res, {
      projects,
      tasks,
      members: filteredMembers,
    });
  } catch (error) {
    sendError(res, 'Search operation failed', 500);
  }
}
