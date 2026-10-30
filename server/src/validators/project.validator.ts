import { z } from 'zod';
import { PROJECT_STATUS, TASK_PRIORITY, ROLES } from '../config/constants.js';

export const createProjectSchema = z.object({
  name: z.string().min(2, 'Project name must be at least 2 characters').max(100),
  key: z
    .string()
    .min(2, 'Project key must be 2-10 uppercase alphanumeric characters')
    .max(10)
    .regex(/^[A-Za-z0-9]+$/, 'Key must be alphanumeric'),
  description: z.string().max(1000).optional(),
  status: z.enum([
    PROJECT_STATUS.PLANNING,
    PROJECT_STATUS.ACTIVE,
    PROJECT_STATUS.ON_HOLD,
    PROJECT_STATUS.COMPLETED,
    PROJECT_STATUS.ARCHIVED,
  ]).optional(),
  priority: z.enum([
    TASK_PRIORITY.LOW,
    TASK_PRIORITY.MEDIUM,
    TASK_PRIORITY.HIGH,
    TASK_PRIORITY.URGENT,
  ]).optional(),
  startDate: z.string().datetime().or(z.date()).optional().nullable(),
  dueDate: z.string().datetime().or(z.date()).optional().nullable(),
  tags: z.array(z.string().trim()).optional(),
  visibility: z.enum(['workspace', 'private']).optional(),
});

export const updateProjectSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  description: z.string().max(1000).optional(),
  status: z.enum([
    PROJECT_STATUS.PLANNING,
    PROJECT_STATUS.ACTIVE,
    PROJECT_STATUS.ON_HOLD,
    PROJECT_STATUS.COMPLETED,
    PROJECT_STATUS.ARCHIVED,
  ]).optional(),
  priority: z.enum([
    TASK_PRIORITY.LOW,
    TASK_PRIORITY.MEDIUM,
    TASK_PRIORITY.HIGH,
    TASK_PRIORITY.URGENT,
  ]).optional(),
  startDate: z.string().datetime().or(z.date()).optional().nullable(),
  dueDate: z.string().datetime().or(z.date()).optional().nullable(),
  tags: z.array(z.string().trim()).optional(),
  visibility: z.enum(['workspace', 'private']).optional(),
  isArchived: z.boolean().optional(),
});

export const addProjectMemberSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  role: z.enum([ROLES.ADMIN, ROLES.PROJECT_MANAGER, ROLES.MEMBER, ROLES.VIEWER]),
});
