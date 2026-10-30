import { Response } from 'express';
import mongoose from 'mongoose';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { Board } from '../models/Board.js';
import { Project } from '../models/Project.js';
import { WorkspaceMember } from '../models/WorkspaceMember.js';
import { ROLES } from '../config/constants.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { logActivity } from '../services/activityService.js';
import { emitToProject } from '../sockets/socketHandler.js';

export async function getProjectBoards(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { projectId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      sendError(res, 'Invalid project ID', 400);
      return;
    }

    const boards = await Board.find({ projectId }).sort({ isDefault: -1, createdAt: 1 });
    sendSuccess(res, boards);
  } catch (error) {
    sendError(res, 'Failed to fetch boards', 500);
  }
}

export async function createBoard(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { projectId } = req.params;
    const { name } = req.body;

    const project = await Project.findById(projectId);
    if (!project) {
      sendError(res, 'Project not found', 404);
      return;
    }

    const board = await Board.create({
      projectId,
      workspaceId: project.workspaceId,
      name,
      isDefault: false,
      columns: [
        { id: 'backlog', name: 'Backlog', order: 0, color: '#94a3b8' },
        { id: 'todo', name: 'To Do', order: 1, color: '#3b82f6' },
        { id: 'in_progress', name: 'In Progress', order: 2, color: '#f59e0b' },
        { id: 'in_review', name: 'In Review', order: 3, color: '#8b5cf6' },
        { id: 'done', name: 'Done', order: 4, color: '#10b981' },
      ],
    });

    await logActivity({
      workspaceId: project.workspaceId,
      projectId,
      actorId: req.user!._id,
      action: 'created board',
      details: { boardName: name },
    });

    emitToProject(projectId, 'board:created', board);

    sendSuccess(res, board, 'Board created', 201);
  } catch (error) {
    sendError(res, 'Failed to create board', 500);
  }
}

export async function updateBoard(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { boardId } = req.params;
    const { name } = req.body;

    const board = await Board.findById(boardId);
    if (!board) {
      sendError(res, 'Board not found', 404);
      return;
    }

    if (name) board.name = name;
    await board.save();

    emitToProject(board.projectId.toString(), 'board:updated', board);

    sendSuccess(res, board, 'Board updated');
  } catch (error) {
    sendError(res, 'Failed to update board', 500);
  }
}

export async function updateBoardColumns(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { boardId } = req.params;
    const { columns } = req.body;

    const board = await Board.findById(boardId);
    if (!board) {
      sendError(res, 'Board not found', 404);
      return;
    }

    board.columns = columns;
    await board.save();

    emitToProject(board.projectId.toString(), 'board:columns_updated', {
      boardId,
      columns: board.columns,
    });

    sendSuccess(res, board, 'Columns updated');
  } catch (error) {
    sendError(res, 'Failed to update columns', 500);
  }
}

export async function deleteBoard(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { boardId } = req.params;

    const board = await Board.findById(boardId);
    if (!board) {
      sendError(res, 'Board not found', 404);
      return;
    }

    if (board.isDefault) {
      sendError(res, 'Cannot delete the default project board', 400);
      return;
    }

    await Board.findByIdAndDelete(boardId);
    emitToProject(board.projectId.toString(), 'board:deleted', { boardId });

    sendSuccess(res, null, 'Board deleted');
  } catch (error) {
    sendError(res, 'Failed to delete board', 500);
  }
}
