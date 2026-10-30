import { Router } from 'express';
import {
  getTaskComments,
  createComment,
  updateComment,
  deleteComment,
} from '../controllers/comments.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validateRequest.js';
import { createCommentSchema, updateCommentSchema } from '../validators/comment.validator.js';

const router = Router();

router.use(requireAuth);

router.get('/task/:taskId', getTaskComments);
router.post('/task/:taskId', validateRequest({ body: createCommentSchema }), createComment);
router.patch('/:commentId', validateRequest({ body: updateCommentSchema }), updateComment);
router.delete('/:commentId', deleteComment);

export default router;
