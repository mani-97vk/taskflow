import { Response } from 'express';
import mongoose from 'mongoose';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { Project } from '../models/Project.js';
import { Task } from '../models/Task.js';
import { WorkspaceMember } from '../models/WorkspaceMember.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { generateCSV } from '../utils/csvExport.js';

export async function getOverview(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { workspaceId } = req.query;

    if (!workspaceId || typeof workspaceId !== 'string') {
      sendError(res, 'workspaceId is required', 400);
      return;
    }

    const wsObjectId = new mongoose.Types.ObjectId(workspaceId);
    const userId = req.user!._id;
    const now = new Date();

    const [
      totalProjects,
      activeProjects,
      totalTasks,
      completedTasks,
      inProgressTasks,
      overdueTasks,
      assignedToMe,
      statusBreakdown,
      priorityBreakdown,
      projectProgressList,
      upcomingDeadlines,
    ] = await Promise.all([
      Project.countDocuments({ workspaceId: wsObjectId, isArchived: false }),
      Project.countDocuments({ workspaceId: wsObjectId, status: 'active', isArchived: false }),
      Task.countDocuments({ workspaceId: wsObjectId, isArchived: false }),
      Task.countDocuments({ workspaceId: wsObjectId, columnId: 'done', isArchived: false }),
      Task.countDocuments({ workspaceId: wsObjectId, columnId: 'in_progress', isArchived: false }),
      Task.countDocuments({
        workspaceId: wsObjectId,
        columnId: { $ne: 'done' },
        dueDate: { $lt: now },
        isArchived: false,
      }),
      Task.countDocuments({
        workspaceId: wsObjectId,
        assignees: userId,
        isArchived: false,
      }),
      Task.aggregate([
        { $match: { workspaceId: wsObjectId, isArchived: false } },
        { $group: { _id: '$columnId', count: { $sum: 1 } } },
      ]),
      Task.aggregate([
        { $match: { workspaceId: wsObjectId, isArchived: false } },
        { $group: { _id: '$priority', count: { $sum: 1 } } },
      ]),
      Project.find({ workspaceId: wsObjectId, isArchived: false })
        .select('name key status')
        .limit(10)
        .lean(),
      Task.find({
        workspaceId: wsObjectId,
        columnId: { $ne: 'done' },
        dueDate: { $gte: now },
        isArchived: false,
      })
        .populate('projectId', 'name key')
        .populate('assignees', 'name email avatarUrl')
        .sort({ dueDate: 1 })
        .limit(5)
        .lean(),
    ]);

    // Calculate progress for projects
    const projectsWithProgress = await Promise.all(
      projectProgressList.map(async (p) => {
        const total = await Task.countDocuments({ projectId: p._id, isArchived: false });
        const done = await Task.countDocuments({ projectId: p._id, columnId: 'done', isArchived: false });
        return {
          id: p._id,
          name: p.name,
          key: p.key,
          total,
          done,
          progress: total > 0 ? Math.round((done / total) * 100) : 0,
        };
      })
    );

    // Format distributions for Recharts
    const statusData = [
      { name: 'Backlog', value: statusBreakdown.find((s) => s._id === 'backlog')?.count || 0, color: '#94a3b8' },
      { name: 'To Do', value: statusBreakdown.find((s) => s._id === 'todo')?.count || 0, color: '#3b82f6' },
      { name: 'In Progress', value: statusBreakdown.find((s) => s._id === 'in_progress')?.count || 0, color: '#f59e0b' },
      { name: 'In Review', value: statusBreakdown.find((s) => s._id === 'in_review')?.count || 0, color: '#8b5cf6' },
      { name: 'Done', value: statusBreakdown.find((s) => s._id === 'done')?.count || 0, color: '#10b981' },
    ];

    const priorityData = [
      { name: 'Low', value: priorityBreakdown.find((p) => p._id === 'low')?.count || 0, color: '#10b981' },
      { name: 'Medium', value: priorityBreakdown.find((p) => p._id === 'medium')?.count || 0, color: '#3b82f6' },
      { name: 'High', value: priorityBreakdown.find((p) => p._id === 'high')?.count || 0, color: '#f59e0b' },
      { name: 'Urgent', value: priorityBreakdown.find((p) => p._id === 'urgent')?.count || 0, color: '#ef4444' },
    ];

    sendSuccess(res, {
      totalProjects,
      activeProjects,
      totalTasks,
      completedTasks,
      inProgressTasks,
      overdueTasks,
      assignedToMe,
      statusData,
      priorityData,
      projectsWithProgress,
      upcomingDeadlines,
    });
  } catch (error) {
    sendError(res, 'Failed to fetch overview metrics', 500);
  }
}

export async function getTaskReport(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { workspaceId } = req.query;

    if (!workspaceId || typeof workspaceId !== 'string') {
      sendError(res, 'workspaceId is required', 400);
      return;
    }

    const wsObjectId = new mongoose.Types.ObjectId(workspaceId);

    // Workload by assignee
    const workload = await Task.aggregate([
      { $match: { workspaceId: wsObjectId, isArchived: false } },
      { $unwind: { path: '$assignees', preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: '$assignees',
          total: { $sum: 1 },
          completed: {
            $sum: { $cond: [{ $eq: ['$columnId', 'done'] }, 1, 0] },
          },
          inProgress: {
            $sum: { $cond: [{ $eq: ['$columnId', 'in_progress'] }, 1, 0] },
          },
        },
      },
    ]);

    const populatedWorkload = await Promise.all(
      workload.map(async (item) => {
        if (!item._id) {
          return {
            userName: 'Unassigned',
            email: '',
            total: item.total,
            completed: item.completed,
            inProgress: item.inProgress,
          };
        }
        const member = await WorkspaceMember.findOne({
          workspaceId: wsObjectId,
          userId: item._id,
        }).populate('userId', 'name email');

        return {
          userId: item._id,
          userName: (member?.userId as any)?.name || 'Unknown',
          email: (member?.userId as any)?.email || '',
          total: item.total,
          completed: item.completed,
          inProgress: item.inProgress,
        };
      })
    );

    sendSuccess(res, { workload: populatedWorkload });
  } catch (error) {
    sendError(res, 'Failed to fetch task report', 500);
  }
}

export async function exportCSV(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { workspaceId, projectId } = req.query;

    if (!workspaceId || typeof workspaceId !== 'string') {
      sendError(res, 'workspaceId is required', 400);
      return;
    }

    const query: any = { workspaceId, isArchived: false };
    if (projectId && typeof projectId === 'string') {
      query.projectId = projectId;
    }

    const tasks = await Task.find(query)
      .populate('projectId', 'name key')
      .populate('assignees', 'name email')
      .populate('creatorId', 'name')
      .sort({ createdAt: -1 })
      .lean();

    const headers = [
      'Task ID',
      'Project',
      'Title',
      'Column/Status',
      'Priority',
      'Assignees',
      'Creator',
      'Due Date',
      'Created Date',
    ];

    const rows = tasks.map((t) => [
      `${(t.projectId as any)?.key || 'TF'}-${t.taskNumber}`,
      (t.projectId as any)?.name || '',
      t.title,
      t.columnId,
      t.priority,
      (t.assignees as any[])?.map((a) => a.name).join('; ') || 'Unassigned',
      (t.creatorId as any)?.name || '',
      t.dueDate ? new Date(t.dueDate).toISOString().split('T')[0] : '',
      t.createdAt ? new Date(t.createdAt).toISOString().split('T')[0] : '',
    ]);

    const csvData = generateCSV(headers, rows);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="taskflow-tasks-export-${Date.now()}.csv"`);
    res.status(200).send(csvData);
  } catch (error) {
    sendError(res, 'Failed to export CSV', 500);
  }
}
