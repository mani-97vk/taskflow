import { Router } from 'express';
import {
  listProjectTasks,
  getMyTasks,
  getTask,
  createTask,
  updateTask,
  moveTask,
  reorderTasks,
  deleteTask,
  addChecklistItem,
  toggleChecklistItem,
  deleteChecklistItem,
  uploadAttachment as uploadAttachmentHandler,
  deleteAttachment,
} from '../controllers/tasks.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validateRequest.js';
import {
  createTaskSchema,
  updateTaskSchema,
  moveTaskSchema,
  reorderTasksSchema,
  checklistItemSchema,
} from '../validators/task.validator.js';
import { uploadAttachment } from '../middleware/upload.js';

const router = Router();

router.use(requireAuth);

// "My Tasks" endpoint
router.get('/my', getMyTasks);

// Batch reorder
router.post('/reorder', validateRequest({ body: reorderTasksSchema }), reorderTasks);

// Project-scoped task endpoints
router.get('/project/:projectId', listProjectTasks);
router.post('/project/:projectId', validateRequest({ body: createTaskSchema }), createTask);

// Task individual operations
router.get('/:taskId', getTask);
router.patch('/:taskId', validateRequest({ body: updateTaskSchema }), updateTask);
router.delete('/:taskId', deleteTask);
router.patch('/:taskId/move', validateRequest({ body: moveTaskSchema }), moveTask);

// Checklist items
router.post('/:taskId/checklist', validateRequest({ body: checklistItemSchema }), addChecklistItem);
router.patch('/:taskId/checklist/:itemId', toggleChecklistItem);
router.delete('/:taskId/checklist/:itemId', deleteChecklistItem);

// File attachments
router.post('/:taskId/attachments', uploadAttachment.single('file'), uploadAttachmentHandler);
router.delete('/:taskId/attachments/:attachmentId', deleteAttachment);

export default router;
