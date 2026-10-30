import { z } from 'zod';
import { TASK_PRIORITY } from '../config/constants.js';

export const createTaskSchema = z.object({
  projectId: z.string().optional(),
  boardId: z.string().optional(),
  columnId: z.string().min(1, 'Column ID is required'),
  title: z.string().min(1, 'Title is required').max(250),
  description: z.string().max(5000).optional(),
  assignees: z.array(z.string()).optional(),
  priority: z.enum([
    TASK_PRIORITY.LOW,
    TASK_PRIORITY.MEDIUM,
    TASK_PRIORITY.HIGH,
    TASK_PRIORITY.URGENT,
  ]).optional(),
  status: z.string().optional(),
  startDate: z.string().datetime().or(z.date()).optional().nullable(),
  dueDate: z.string().datetime().or(z.date()).optional().nullable(),
  labels: z.array(z.string().trim()).optional(),
  estimatedEffort: z.number().min(0).optional(),
  actualEffort: z.number().min(0).optional(),
  parentTaskId: z.string().optional().nullable(),
});

export const updateTaskSchema = z.object({
  title: z.string().min(1).max(250).optional(),
  description: z.string().max(5000).optional(),
  assignees: z.array(z.string()).optional(),
  priority: z.enum([
    TASK_PRIORITY.LOW,
    TASK_PRIORITY.MEDIUM,
    TASK_PRIORITY.HIGH,
    TASK_PRIORITY.URGENT,
  ]).optional(),
  status: z.string().optional(),
  columnId: z.string().optional(),
  startDate: z.string().datetime().or(z.date()).optional().nullable(),
  dueDate: z.string().datetime().or(z.date()).optional().nullable(),
  labels: z.array(z.string().trim()).optional(),
  estimatedEffort: z.number().min(0).optional(),
  actualEffort: z.number().min(0).optional(),
  isArchived: z.boolean().optional(),
});

export const moveTaskSchema = z.object({
  columnId: z.string().min(1, 'Column ID is required'),
  position: z.number().min(0, 'Position must be 0 or positive'),
});

export const reorderTasksSchema = z.object({
  tasks: z.array(
    z.object({
      id: z.string(),
      columnId: z.string(),
      position: z.number(),
    })
  ),
});

export const checklistItemSchema = z.object({
  title: z.string().min(1, 'Item title is required').max(200),
  completed: z.boolean().optional(),
});
