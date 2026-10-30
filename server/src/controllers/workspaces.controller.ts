import { Response } from 'express';
import crypto from 'crypto';
import mongoose from 'mongoose';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { Workspace } from '../models/Workspace.js';
import { WorkspaceMember } from '../models/WorkspaceMember.js';
import { Invitation } from '../models/Invitation.js';
import { User } from '../models/User.js';
import { Project } from '../models/Project.js';
import { Task } from '../models/Task.js';
import { Board } from '../models/Board.js';
import { ROLES } from '../config/constants.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { logActivity } from '../services/activityService.js';
import { createNotification } from '../services/notificationService.js';

export async function listWorkspaces(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const memberships = await WorkspaceMember.find({ userId: req.user!._id })
      .populate('workspaceId')
      .lean();

    const workspaces = memberships
      .filter((m) => m.workspaceId)
      .map((m) => ({
        ...(m.workspaceId as any),
        role: m.role,
        joinedAt: m.joinedAt,
      }));

    sendSuccess(res, workspaces);
  } catch (error) {
    sendError(res, 'Failed to fetch workspaces', 500);
  }
}

export async function createWorkspace(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { name, description } = req.body;
    const slug = `${name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now().toString().slice(-4)}`;

    const workspace = await Workspace.create({
      name,
      slug,
      description: description || '',
      ownerId: req.user!._id,
    });

    const membership = await WorkspaceMember.create({
      workspaceId: workspace._id,
      userId: req.user!._id,
      role: ROLES.OWNER,
    });

    await logActivity({
      workspaceId: workspace._id,
      actorId: req.user!._id,
      action: 'created workspace',
      details: { workspaceName: workspace.name },
    });

    sendSuccess(res, { ...workspace.toJSON(), role: membership.role }, 'Workspace created', 201);
  } catch (error) {
    sendError(res, 'Failed to create workspace', 500);
  }
}

export async function getWorkspace(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { workspaceId } = req.params;
    const workspace = await Workspace.findById(workspaceId).populate('ownerId', 'name email avatarUrl');

    if (!workspace) {
      sendError(res, 'Workspace not found', 404);
      return;
    }

    const memberCount = await WorkspaceMember.countDocuments({ workspaceId });
    const projectCount = await Project.countDocuments({ workspaceId, isArchived: false });

    sendSuccess(res, {
      ...workspace.toJSON(),
      memberCount,
      projectCount,
      role: req.workspaceMember?.role,
    });
  } catch (error) {
    sendError(res, 'Failed to fetch workspace', 500);
  }
}

export async function updateWorkspace(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { workspaceId } = req.params;
    const { name, description } = req.body;

    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      sendError(res, 'Workspace not found', 404);
      return;
    }

    if (name) workspace.name = name;
    if (description !== undefined) workspace.description = description;

    await workspace.save();

    await logActivity({
      workspaceId: workspace._id,
      actorId: req.user!._id,
      action: 'updated workspace details',
      details: { name, description },
    });

    sendSuccess(res, workspace, 'Workspace updated');
  } catch (error) {
    sendError(res, 'Failed to update workspace', 500);
  }
}

export async function deleteWorkspace(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { workspaceId } = req.params;

    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      sendError(res, 'Workspace not found', 404);
      return;
    }

    if (workspace.ownerId.toString() !== req.user!._id.toString()) {
      sendError(res, 'Only the workspace owner can delete the workspace', 403);
      return;
    }

    // Cascade delete associated records
    await Task.deleteMany({ workspaceId });
    await Board.deleteMany({ workspaceId });
    await Project.deleteMany({ workspaceId });
    await WorkspaceMember.deleteMany({ workspaceId });
    await Invitation.deleteMany({ workspaceId });
    await Workspace.findByIdAndDelete(workspaceId);

    sendSuccess(res, null, 'Workspace deleted successfully');
  } catch (error) {
    sendError(res, 'Failed to delete workspace', 500);
  }
}

export async function listMembers(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { workspaceId } = req.params;
    const members = await WorkspaceMember.find({ workspaceId })
      .populate('userId', 'name email avatarUrl bio lastLogin')
      .sort({ role: 1, createdAt: 1 })
      .lean();

    sendSuccess(res, members);
  } catch (error) {
    sendError(res, 'Failed to fetch members', 500);
  }
}

export async function inviteMember(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { workspaceId } = req.params;
    const { email, role } = req.body;

    const targetUser = await User.findOne({ email: email.toLowerCase() });
    if (targetUser) {
      const existingMember = await WorkspaceMember.findOne({
        workspaceId,
        userId: targetUser._id,
      });
      if (existingMember) {
        sendError(res, 'User is already a member of this workspace', 409);
        return;
      }
    }

    const token = crypto.randomBytes(24).toString('hex');
    const invitation = await Invitation.create({
      workspaceId,
      email: email.toLowerCase(),
      role: role || ROLES.MEMBER,
      token,
      invitedBy: req.user!._id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    });

    if (targetUser) {
      await createNotification({
        recipientId: targetUser._id,
        workspaceId,
        type: 'workspace_invitation',
        title: 'Workspace Invitation',
        message: `${req.user!.name} invited you to join workspace`,
        actionUrl: `/invitations/${token}`,
      });
    }

    await logActivity({
      workspaceId,
      actorId: req.user!._id,
      action: 'invited member',
      details: { email, role },
    });

    sendSuccess(
      res,
      {
        invitation,
        inviteLink: `/invitations/${token}`,
      },
      'Invitation created successfully',
      201
    );
  } catch (error) {
    sendError(res, 'Failed to invite member', 500);
  }
}

export async function acceptInvitation(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { token } = req.params;

    const invitation = await Invitation.findOne({
      token,
      status: 'pending',
      expiresAt: { $gt: new Date() },
    });

    if (!invitation) {
      sendError(res, 'Invalid or expired invitation token', 400);
      return;
    }

    // Verify user email matches invitation or allow user to join
    let membership = await WorkspaceMember.findOne({
      workspaceId: invitation.workspaceId,
      userId: req.user!._id,
    });

    if (!membership) {
      membership = await WorkspaceMember.create({
        workspaceId: invitation.workspaceId,
        userId: req.user!._id,
        role: invitation.role,
      });
    }

    invitation.status = 'accepted';
    invitation.acceptedAt = new Date();
    await invitation.save();

    await logActivity({
      workspaceId: invitation.workspaceId,
      actorId: req.user!._id,
      action: 'joined workspace',
      details: { role: invitation.role },
    });

    sendSuccess(res, { workspaceId: invitation.workspaceId }, 'Invitation accepted successfully');
  } catch (error) {
    sendError(res, 'Failed to accept invitation', 500);
  }
}

export async function updateMemberRole(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { workspaceId, userId } = req.params;
    const { role } = req.body;

    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      sendError(res, 'Workspace not found', 404);
      return;
    }

    if (workspace.ownerId.toString() === userId && role !== ROLES.OWNER) {
      sendError(res, 'Cannot change the role of the workspace owner', 400);
      return;
    }

    const member = await WorkspaceMember.findOneAndUpdate(
      { workspaceId, userId },
      { role },
      { new: true }
    ).populate('userId', 'name email avatarUrl');

    if (!member) {
      sendError(res, 'Workspace member not found', 404);
      return;
    }

    await logActivity({
      workspaceId,
      actorId: req.user!._id,
      action: 'updated member role',
      details: { memberId: userId, newRole: role },
    });

    sendSuccess(res, member, 'Member role updated');
  } catch (error) {
    sendError(res, 'Failed to update member role', 500);
  }
}

export async function removeMember(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { workspaceId, userId } = req.params;

    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      sendError(res, 'Workspace not found', 404);
      return;
    }

    if (workspace.ownerId.toString() === userId) {
      sendError(res, 'Cannot remove the workspace owner', 400);
      return;
    }

    await WorkspaceMember.findOneAndDelete({ workspaceId, userId });

    await logActivity({
      workspaceId,
      actorId: req.user!._id,
      action: 'removed member from workspace',
      details: { memberId: userId },
    });

    sendSuccess(res, null, 'Member removed from workspace');
  } catch (error) {
    sendError(res, 'Failed to remove member', 500);
  }
}
