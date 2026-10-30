import { Response } from 'express';
import mongoose from 'mongoose';
import path from 'path';
import fs from 'fs';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { Task } from '../models/Task.js';
import { Project } from '../models/Project.js';
import { Board } from '../models/Board.js';
import { Comment } from '../models/Comment.js';
import { WorkspaceMember } from '../models/WorkspaceMember.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { logActivity } from '../services/activityService.js';
import { createNotification } from '../services/notificationService.js';
import { emitToProject, emitToWorkspace } from '../sockets/socketHandler.js';

export async function listProjectTasks(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { projectId } = req.params;
    const { assignee, priority, status, columnId, search, label } = req.query;

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      sendError(res, 'Invalid project ID', 400);
      return;
    }

    const query: any = { projectId, isArchived: false };

    if (assignee && typeof assignee === 'string') {
      query.assignees = assignee;
    }

    if (priority && typeof priority === 'string') {
      query.priority = priority;
    }

    if (status && typeof status === 'string') {
      query.status = status;
    }

    if (columnId && typeof columnId === 'string') {
      query.columnId = columnId;
    }

    if (label && typeof label === 'string') {
      query.labels = label;
    }

    if (search && typeof search === 'string') {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const tasks = await Task.find(query)
      .populate('assignees', 'name email avatarUrl')
      .populate('creatorId', 'name email avatarUrl')
      .populate('projectId', 'name key')
      .sort({ position: 1, createdAt: 1 })
      .lean();

    sendSuccess(res, tasks);
  } catch (error) {
    sendError(res, 'Failed to fetch tasks', 500);
  }
}

export async function getMyTasks(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { workspaceId, view, priority, search } = req.query;
    const userId = req.user!._id;

    const query: any = { isArchived: false };

    if (workspaceId && typeof workspaceId === 'string' && mongoose.Types.ObjectId.isValid(workspaceId)) {
      query.workspaceId = workspaceId;
    }

    if (priority && typeof priority === 'string') {
      query.priority = priority;
    }

    if (search && typeof search === 'string') {
      query.title = { $regex: search, $options: 'i' };
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    switch (view) {
      case 'created':
        query.creatorId = userId;
        break;
      case 'today':
        query.assignees = userId;
        query.dueDate = { $gte: todayStart, $lte: todayEnd };
        break;
      case 'upcoming':
        query.assignees = userId;
        query.dueDate = { $gt: todayEnd };
        break;
      case 'overdue':
        query.assignees = userId;
        query.columnId = { $ne: 'done' };
        query.dueDate = { $lt: todayStart };
        break;
      case 'completed':
        query.assignees = userId;
        query.columnId = 'done';
        break;
      case 'all':
      case 'assigned':
      default:
        query.assignees = userId;
        break;
    }

    const tasks = await Task.find(query)
      .populate('assignees', 'name email avatarUrl')
      .populate('creatorId', 'name email avatarUrl')
      .populate('projectId', 'name key')
      .sort({ dueDate: 1, updatedAt: -1 })
      .lean();

    sendSuccess(res, tasks);
  } catch (error) {
    sendError(res, 'Failed to fetch user tasks', 500);
  }
}

export async function getTask(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { taskId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(taskId)) {
      sendError(res, 'Invalid task ID', 400);
      return;
    }

    const task = await Task.findById(taskId)
      .populate('assignees', 'name email avatarUrl')
      .populate('creatorId', 'name email avatarUrl')
      .populate('projectId', 'name key workspaceId')
      .populate('attachments.uploadedBy', 'name email avatarUrl')
      .populate('parentTaskId', 'title taskNumber');

    if (!task) {
      sendError(res, 'Task not found', 404);
      return;
    }

    sendSuccess(res, task);
  } catch (error) {
    sendError(res, 'Failed to fetch task details', 500);
  }
}

export async function createTask(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { projectId } = req.params;
    const {
      columnId,
      boardId,
      title,
      description,
      assignees,
      priority,
      status,
      startDate,
      dueDate,
      labels,
      estimatedEffort,
      actualEffort,
      parentTaskId,
    } = req.body;

    const project = await Project.findById(projectId);
    if (!project) {
      sendError(res, 'Project not found', 404);
      return;
    }

    // Determine board
    let targetBoardId = boardId;
    if (!targetBoardId) {
      const defaultBoard = await Board.findOne({ projectId, isDefault: true });
      targetBoardId = defaultBoard?._id;
    }

    // Determine task number
    const count = await Task.countDocuments({ projectId });
    const taskNumber = count + 1;

    // Determine position in column
    const lastTaskInCol = await Task.findOne({ projectId, columnId }).sort({ position: -1 });
    const position = lastTaskInCol ? lastTaskInCol.position + 1000 : 1000;

    const task = await Task.create({
      workspaceId: project.workspaceId,
      projectId,
      boardId: targetBoardId,
      columnId: columnId || 'todo',
      taskNumber,
      title,
      description: description || '',
      assignees: assignees || [],
      creatorId: req.user!._id,
      priority: priority || 'medium',
      status: status || columnId || 'todo',
      startDate: startDate || null,
      dueDate: dueDate || null,
      labels: labels || [],
      estimatedEffort: estimatedEffort || 0,
      actualEffort: actualEffort || 0,
      position,
      parentTaskId: parentTaskId || null,
      checklist: [],
      attachments: [],
    });

    const populated = await Task.findById(task._id)
      .populate('assignees', 'name email avatarUrl')
      .populate('creatorId', 'name email avatarUrl')
      .populate('projectId', 'name key');

    await logActivity({
      workspaceId: project.workspaceId,
      projectId,
      taskId: task._id,
      actorId: req.user!._id,
      action: 'created task',
      details: { taskNumber, title },
    });

    // Notify assigned members
    if (assignees && assignees.length > 0) {
      for (const assigneeId of assignees) {
        if (assigneeId.toString() !== req.user!._id.toString()) {
          await createNotification({
            recipientId: assigneeId,
            workspaceId: project.workspaceId,
            projectId,
            taskId: task._id,
            type: 'task_assigned',
            title: 'Assigned to task',
            message: `${req.user!.name} assigned you to ${project.key}-${taskNumber}: ${title}`,
            actionUrl: `/projects/${projectId}/tasks/${task._id}`,
          });
        }
      }
    }

    emitToProject(projectId, 'task:created', populated);

    sendSuccess(res, populated, 'Task created successfully', 201);
  } catch (error) {
    console.error('Create task error:', error);
    sendError(res, 'Failed to create task', 500);
  }
}

export async function updateTask(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { taskId } = req.params;
    const task = await Task.findById(taskId);

    if (!task) {
      sendError(res, 'Task not found', 404);
      return;
    }

    const {
      title,
      description,
      assignees,
      priority,
      status,
      columnId,
      startDate,
      dueDate,
      labels,
      estimatedEffort,
      actualEffort,
      isArchived,
    } = req.body;

    const previousAssignees = task.assignees.map((id) => id.toString());

    if (title !== undefined) task.title = title;
    if (description !== undefined) task.description = description;
    if (assignees !== undefined) task.assignees = assignees;
    if (priority !== undefined) task.priority = priority;
    if (status !== undefined) task.status = status;
    if (columnId !== undefined) {
      task.columnId = columnId;
      if (columnId === 'done' && !task.completedAt) {
        task.completedAt = new Date();
      } else if (columnId !== 'done') {
        task.completedAt = undefined;
      }
    }
    if (startDate !== undefined) task.startDate = startDate;
    if (dueDate !== undefined) task.dueDate = dueDate;
    if (labels !== undefined) task.labels = labels;
    if (estimatedEffort !== undefined) task.estimatedEffort = estimatedEffort;
    if (actualEffort !== undefined) task.actualEffort = actualEffort;
    if (isArchived !== undefined) task.isArchived = isArchived;

    await task.save();

    const populated = await Task.findById(task._id)
      .populate('assignees', 'name email avatarUrl')
      .populate('creatorId', 'name email avatarUrl')
      .populate('projectId', 'name key')
      .populate('attachments.uploadedBy', 'name email avatarUrl');

    await logActivity({
      workspaceId: task.workspaceId,
      projectId: task.projectId,
      taskId: task._id,
      actorId: req.user!._id,
      action: 'updated task',
      details: { updates: req.body },
    });

    // Notify newly assigned members
    if (assignees) {
      const newAssignees = assignees.filter(
        (id: string) => !previousAssignees.includes(id) && id !== req.user!._id.toString()
      );
      for (const newId of newAssignees) {
        await createNotification({
          recipientId: newId,
          workspaceId: task.workspaceId,
          projectId: task.projectId,
          taskId: task._id,
          type: 'task_assigned',
          title: 'Assigned to task',
          message: `${req.user!.name} assigned you to task: ${task.title}`,
          actionUrl: `/projects/${task.projectId}/tasks/${task._id}`,
        });
      }
    }

    emitToProject(task.projectId.toString(), 'task:updated', populated);

    sendSuccess(res, populated, 'Task updated');
  } catch (error) {
    sendError(res, 'Failed to update task', 500);
  }
}

export async function moveTask(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { taskId } = req.params;
    const { columnId, position } = req.body;

    const task = await Task.findById(taskId);
    if (!task) {
      sendError(res, 'Task not found', 404);
      return;
    }

    task.columnId = columnId;
    task.position = position;
    if (columnId === 'done' && !task.completedAt) {
      task.completedAt = new Date();
    } else if (columnId !== 'done') {
      task.completedAt = undefined;
    }

    await task.save();

    emitToProject(task.projectId.toString(), 'task:moved', {
      taskId: task._id,
      projectId: task.projectId,
      columnId,
      position,
    });

    sendSuccess(res, task, 'Task moved successfully');
  } catch (error) {
    sendError(res, 'Failed to move task', 500);
  }
}

export async function reorderTasks(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { tasks } = req.body; // Array of { id, columnId, position }

    const bulkOps = tasks.map((t: any) => ({
      updateOne: {
        filter: { _id: t.id },
        update: {
          $set: {
            columnId: t.columnId,
            position: t.position,
            ...(t.columnId === 'done' ? { completedAt: new Date() } : {}),
          },
        },
      },
    }));

    if (bulkOps.length > 0) {
      await Task.bulkWrite(bulkOps);
    }

    sendSuccess(res, null, 'Tasks reordered successfully');
  } catch (error) {
    sendError(res, 'Failed to reorder tasks', 500);
  }
}

export async function deleteTask(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { taskId } = req.params;
    const task = await Task.findById(taskId);

    if (!task) {
      sendError(res, 'Task not found', 404);
      return;
    }

    // Delete comments and task
    await Comment.deleteMany({ taskId });
    await Task.findByIdAndDelete(taskId);

    await logActivity({
      workspaceId: task.workspaceId,
      projectId: task.projectId,
      actorId: req.user!._id,
      action: 'deleted task',
      details: { title: task.title, taskNumber: task.taskNumber },
    });

    emitToProject(task.projectId.toString(), 'task:deleted', {
      taskId,
      projectId: task.projectId,
    });

    sendSuccess(res, null, 'Task deleted successfully');
  } catch (error) {
    sendError(res, 'Failed to delete task', 500);
  }
}

export async function addChecklistItem(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { taskId } = req.params;
    const { title } = req.body;

    const task = await Task.findById(taskId);
    if (!task) {
      sendError(res, 'Task not found', 404);
      return;
    }

    const newItem = {
      id: new mongoose.Types.ObjectId().toString(),
      title,
      completed: false,
    };

    task.checklist.push(newItem);
    await task.save();

    emitToProject(task.projectId.toString(), 'task:updated', task);

    sendSuccess(res, task.checklist, 'Checklist item added');
  } catch (error) {
    sendError(res, 'Failed to add checklist item', 500);
  }
}

export async function toggleChecklistItem(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { taskId, itemId } = req.params;

    const task = await Task.findById(taskId);
    if (!task) {
      sendError(res, 'Task not found', 404);
      return;
    }

    const item = task.checklist.find((i) => i.id === itemId);
    if (!item) {
      sendError(res, 'Checklist item not found', 404);
      return;
    }

    item.completed = !item.completed;
    item.completedAt = item.completed ? new Date() : undefined;

    await task.save();

    emitToProject(task.projectId.toString(), 'task:updated', task);

    sendSuccess(res, task.checklist, 'Checklist item toggled');
  } catch (error) {
    sendError(res, 'Failed to toggle checklist item', 500);
  }
}

export async function deleteChecklistItem(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { taskId, itemId } = req.params;

    const task = await Task.findById(taskId);
    if (!task) {
      sendError(res, 'Task not found', 404);
      return;
    }

    task.checklist = task.checklist.filter((i) => i.id !== itemId);
    await task.save();

    emitToProject(task.projectId.toString(), 'task:updated', task);

    sendSuccess(res, task.checklist, 'Checklist item removed');
  } catch (error) {
    sendError(res, 'Failed to delete checklist item', 500);
  }
}

export async function uploadAttachment(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { taskId } = req.params;
    const file = req.file;

    if (!file) {
      sendError(res, 'No file uploaded or file rejected by security filter', 400);
      return;
    }

    const task = await Task.findById(taskId);
    if (!task) {
      sendError(res, 'Task not found', 404);
      return;
    }

    const attachment = {
      id: new mongoose.Types.ObjectId().toString(),
      filename: file.filename,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      path: file.path,
      uploadedBy: req.user!._id,
      uploadedAt: new Date(),
    };

    task.attachments.push(attachment);
    await task.save();

    const populated = await Task.findById(taskId).populate('attachments.uploadedBy', 'name email avatarUrl');

    emitToProject(task.projectId.toString(), 'task:updated', populated);

    sendSuccess(res, populated?.attachments, 'File uploaded successfully', 201);
  } catch (error) {
    sendError(res, 'Failed to upload attachment', 500);
  }
}

export async function deleteAttachment(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { taskId, attachmentId } = req.params;

    const task = await Task.findById(taskId);
    if (!task) {
      sendError(res, 'Task not found', 404);
      return;
    }

    const attachment = task.attachments.find((a) => a.id === attachmentId);
    if (!attachment) {
      sendError(res, 'Attachment not found', 404);
      return;
    }

    // Try deleting physical file from disk
    try {
      if (fs.existsSync(attachment.path)) {
        fs.unlinkSync(attachment.path);
      }
    } catch (e) {
      console.warn('Could not remove file from disk:', e);
    }

    task.attachments = task.attachments.filter((a) => a.id !== attachmentId);
    await task.save();

    emitToProject(task.projectId.toString(), 'task:updated', task);

    sendSuccess(res, task.attachments, 'Attachment removed');
  } catch (error) {
    sendError(res, 'Failed to remove attachment', 500);
  }
}
