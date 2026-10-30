import { Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { AuthenticatedRequest } from './auth.js';
import { Workspace } from '../models/Workspace.js';
import { WorkspaceMember } from '../models/WorkspaceMember.js';
import { ROLES, RoleType } from '../config/constants.js';
import { sendError } from '../utils/response.js';

const ROLE_HIERARCHY: Record<RoleType, number> = {
  [ROLES.OWNER]: 100,
  [ROLES.ADMIN]: 80,
  [ROLES.PROJECT_MANAGER]: 60,
  [ROLES.MEMBER]: 40,
  [ROLES.VIEWER]: 20,
};

export function requireWorkspaceMember(requiredMinRole: RoleType = ROLES.VIEWER) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        sendError(res, 'Authentication required', 401);
        return;
      }

      // Extract workspaceId from params, query, or body
      const workspaceId =
        req.params.workspaceId ||
        req.body?.workspaceId ||
        (req.query?.workspaceId as string);

      if (!workspaceId) {
        sendError(res, 'Workspace ID is required', 400);
        return;
      }

      if (!mongoose.Types.ObjectId.isValid(workspaceId)) {
        sendError(res, 'Invalid workspace ID format', 400);
        return;
      }

      const workspace = await Workspace.findById(workspaceId);
      if (!workspace) {
        sendError(res, 'Workspace not found', 404);
        return;
      }

      const membership = await WorkspaceMember.findOne({
        workspaceId,
        userId: req.user._id,
      });

      if (!membership) {
        sendError(res, 'You are not a member of this workspace', 403);
        return;
      }

      const userRoleScore = ROLE_HIERARCHY[membership.role as RoleType] || 0;
      const requiredScore = ROLE_HIERARCHY[requiredMinRole] || 0;

      if (userRoleScore < requiredScore) {
        sendError(
          res,
          `Insufficient permissions. Requires at least '${requiredMinRole}' role.`,
          403
        );
        return;
      }

      req.workspace = workspace;
      req.workspaceMember = membership;
      next();
    } catch (error) {
      sendError(res, 'Authorization check failed', 500);
    }
  };
}
