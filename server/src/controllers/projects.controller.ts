import { Response } from 'express';
import mongoose from 'mongoose';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { Project } from '../models/Project.js';
import { Board } from '../models/Board.js';
import { Task } from '../models/Task.js';
import { WorkspaceMember } from '../models/WorkspaceMember.js';
import { ROLES, PROJECT_STATUS } from '../config/constants.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { logActivity } from '../services/activityService.js';
import { emitToWorkspace, emitToProject } from '../sockets/socketHandler.js';

export async function listProjects(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { workspaceId } = req.params;
    const { status, search, archived } = req.query;

    const query: any = { workspaceId };

    if (archived === 'true') {
      query.isArchived = true;
    } else {
      query.isArchived = false;
    }

    if (status && typeof status === 'string') {
      query.status = status;
    }

    if (search && typeof search === 'string') {
      query.name = { $regex: search, $options: 'i' };
    }

    const projects = await Project.find(query)
      .populate('ownerId', 'name email avatarUrl')
      .populate('members.userId', 'name email avatarUrl')
      .sort({ updatedAt: -1 })
      .lean();

    // Attach task count & progress stats
    const projectStats = await Promise.all(
      projects.map(async (project) => {
        const totalTasks = await Task.countDocuments({ projectId: project._id, isArchived: false });
        const completedTasks = await Task.countDocuments({
          projectId: project._id,
          columnId: 'done',
          isArchived: false,
        });
        const overdueTasks = await Task.countDocuments({
          projectId: project._id,
          columnId: { $ne: 'done' },
          dueDate: { $lt: new Date() },
          isArchived: false,
        });

        const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

        return {
          ...project,
          totalTasks,
          completedTasks,
          overdueTasks,
          progress,
        };
      })
    );

    sendSuccess(res, projectStats);
  } catch (error) {
    sendError(res, 'Failed to fetch projects', 500);
  }
}

export async function createProject(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { workspaceId } = req.params;
    const { name, key, description, priority, startDate, dueDate, tags, visibility } = req.body;

    const upperKey = key.toUpperCase().trim();
    const existingKey = await Project.findOne({ workspaceId, key: upperKey });
    if (existingKey) {
      sendError(res, `A project with key '${upperKey}' already exists in this workspace`, 409);
      return;
    }

    const project = await Project.create({
      workspaceId,
      name,
      key: upperKey,
      description: description || '',
      ownerId: req.user!._id,
      priority: priority || 'medium',
      startDate: startDate || null,
      dueDate: dueDate || null,
      tags: tags || [],
      visibility: visibility || 'workspace',
      members: [{ userId: req.user!._id, role: ROLES.OWNER }],
    });

    // Automatically create default Kanban Board
    const board = await Board.create({
      projectId: project._id,
      workspaceId,
      name: `${name} Board`,
      isDefault: true,
      columns: [
        { id: 'backlog', name: 'Backlog', order: 0, color: '#94a3b8' },
        { id: 'todo', name: 'To Do', order: 1, color: '#3b82f6' },
        { id: 'in_progress', name: 'In Progress', order: 2, color: '#f59e0b' },
        { id: 'in_review', name: 'In Review', order: 3, color: '#8b5cf6' },
        { id: 'done', name: 'Done', order: 4, color: '#10b981' },
      ],
    });

    await logActivity({
      workspaceId,
      projectId: project._id,
      actorId: req.user!._id,
      action: 'created project',
      details: { projectName: project.name, key: project.key },
    });

    emitToWorkspace(workspaceId, 'project:created', project);

    sendSuccess(res, { ...project.toJSON(), defaultBoardId: board._id }, 'Project created', 201);
  } catch (error) {
    console.error('Create project error:', error);
    sendError(res, 'Failed to create project', 500);
  }
}

export async function getProject(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { projectId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      sendError(res, 'Invalid project ID', 400);
      return;
    }

    const project = await Project.findById(projectId)
      .populate('ownerId', 'name email avatarUrl')
      .populate('members.userId', 'name email avatarUrl');

    if (!project) {
      sendError(res, 'Project not found', 404);
      return;
    }

    // Verify workspace membership
    const membership = await WorkspaceMember.findOne({
      workspaceId: project.workspaceId,
      userId: req.user!._id,
    });

    if (!membership) {
      sendError(res, 'You do not have access to this project', 403);
      return;
    }

    // Default board
    const defaultBoard = await Board.findOne({ projectId: project._id, isDefault: true });

    // Task stats
    const totalTasks = await Task.countDocuments({ projectId: project._id, isArchived: false });
    const completedTasks = await Task.countDocuments({
      projectId: project._id,
      columnId: 'done',
      isArchived: false,
    });
    const overdueTasks = await Task.countDocuments({
      projectId: project._id,
      columnId: { $ne: 'done' },
      dueDate: { $lt: new Date() },
      isArchived: false,
    });
    const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    sendSuccess(res, {
      ...project.toJSON(),
      defaultBoardId: defaultBoard?._id,
      columns: defaultBoard?.columns || [],
      stats: {
        totalTasks,
        completedTasks,
        overdueTasks,
        progress,
      },
    });
  } catch (error) {
    sendError(res, 'Failed to fetch project', 500);
  }
}

export async function updateProject(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { projectId } = req.params;
    const project = await Project.findById(projectId);

    if (!project) {
      sendError(res, 'Project not found', 404);
      return;
    }

    const membership = await WorkspaceMember.findOne({
      workspaceId: project.workspaceId,
      userId: req.user!._id,
    });

    if (!membership || (membership.role === ROLES.VIEWER)) {
      sendError(res, 'Insufficient permissions to update project', 403);
      return;
    }

    const { name, description, status, priority, startDate, dueDate, tags, visibility, isArchived } = req.body;

    if (name) project.name = name;
    if (description !== undefined) project.description = description;
    if (status) project.status = status;
    if (priority) project.priority = priority;
    if (startDate !== undefined) project.startDate = startDate;
    if (dueDate !== undefined) project.dueDate = dueDate;
    if (tags !== undefined) project.tags = tags;
    if (visibility) project.visibility = visibility;
    if (isArchived !== undefined) project.isArchived = isArchived;

    await project.save();

    await logActivity({
      workspaceId: project.workspaceId,
      projectId: project._id,
      actorId: req.user!._id,
      action: 'updated project',
      details: { updates: req.body },
    });

    emitToProject(projectId, 'project:updated', project);
    emitToWorkspace(project.workspaceId.toString(), 'project:updated', project);

    sendSuccess(res, project, 'Project updated');
  } catch (error) {
    sendError(res, 'Failed to update project', 500);
  }
}

export async function deleteProject(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { projectId } = req.params;
    const project = await Project.findById(projectId);

    if (!project) {
      sendError(res, 'Project not found', 404);
      return;
    }

    const membership = await WorkspaceMember.findOne({
      workspaceId: project.workspaceId,
      userId: req.user!._id,
    });

    if (!membership || (membership.role !== ROLES.OWNER && membership.role !== ROLES.ADMIN)) {
      sendError(res, 'Only workspace owner or admin can delete a project', 403);
      return;
    }

    // Cascade delete project tasks, boards, comments
    await Task.deleteMany({ projectId });
    await Board.deleteMany({ projectId });
    await Project.findByIdAndDelete(projectId);

    await logActivity({
      workspaceId: project.workspaceId,
      actorId: req.user!._id,
      action: 'deleted project',
      details: { projectName: project.name, key: project.key },
    });

    emitToWorkspace(project.workspaceId.toString(), 'project:deleted', { projectId });

    sendSuccess(res, null, 'Project deleted successfully');
  } catch (error) {
    sendError(res, 'Failed to delete project', 500);
  }
}

export async function addProjectMember(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { projectId } = req.params;
    const { userId, role } = req.body;

    const project = await Project.findById(projectId);
    if (!project) {
      sendError(res, 'Project not found', 404);
      return;
    }

    const existing = project.members.find((m) => m.userId.toString() === userId);
    if (existing) {
      existing.role = role || ROLES.MEMBER;
    } else {
      project.members.push({ userId: new mongoose.Types.ObjectId(userId), role: role || ROLES.MEMBER });
    }

    await project.save();

    await logActivity({
      workspaceId: project.workspaceId,
      projectId: project._id,
      actorId: req.user!._id,
      action: 'added project member',
      details: { memberId: userId, role },
    });

    emitToProject(projectId, 'project:member_added', { projectId, userId, role });

    sendSuccess(res, project, 'Project member updated');
  } catch (error) {
    sendError(res, 'Failed to add project member', 500);
  }
}

export async function removeProjectMember(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { projectId, userId } = req.params;
    const project = await Project.findById(projectId);

    if (!project) {
      sendError(res, 'Project not found', 404);
      return;
    }

    project.members = project.members.filter((m) => m.userId.toString() !== userId);
    await project.save();

    await logActivity({
      workspaceId: project.workspaceId,
      projectId: project._id,
      actorId: req.user!._id,
      action: 'removed project member',
      details: { memberId: userId },
    });

    emitToProject(projectId, 'project:member_removed', { projectId, userId });

    sendSuccess(res, project, 'Project member removed');
  } catch (error) {
    sendError(res, 'Failed to remove project member', 500);
  }
}
