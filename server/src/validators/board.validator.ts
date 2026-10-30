import { z } from 'zod';

export const createBoardSchema = z.object({
  name: z.string().min(2, 'Board name must be at least 2 characters').max(100),
});

export const updateBoardSchema = z.object({
  name: z.string().min(2).max(100).optional(),
});

export const updateBoardColumnsSchema = z.object({
  columns: z.array(
    z.object({
      id: z.string(),
      name: z.string().min(1).max(50),
      order: z.number(),
      color: z.string().optional(),
      taskLimit: z.number().min(0).optional(),
    })
  ),
});
