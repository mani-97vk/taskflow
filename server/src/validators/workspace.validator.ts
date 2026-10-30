import { z } from 'zod';
import { ROLES } from '../config/constants.js';

export const createWorkspaceSchema = z.object({
  name: z.string().min(2, 'Workspace name must be at least 2 characters').max(100),
  description: z.string().max(500).optional(),
});

export const updateWorkspaceSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  description: z.string().max(500).optional(),
});

export const inviteMemberSchema = z.object({
  email: z.string().email('Invalid email address'),
  role: z.enum([ROLES.ADMIN, ROLES.PROJECT_MANAGER, ROLES.MEMBER, ROLES.VIEWER]),
});

export const updateMemberRoleSchema = z.object({
  role: z.enum([ROLES.ADMIN, ROLES.PROJECT_MANAGER, ROLES.MEMBER, ROLES.VIEWER]),
});
