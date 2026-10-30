import { Router } from 'express';
import {
  getProjectBoards,
  createBoard,
  updateBoard,
  updateBoardColumns,
  deleteBoard,
} from '../controllers/boards.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validateRequest.js';
import {
  createBoardSchema,
  updateBoardSchema,
  updateBoardColumnsSchema,
} from '../validators/board.validator.js';

const router = Router();

router.use(requireAuth);

router.get('/project/:projectId', getProjectBoards);
router.post('/project/:projectId', validateRequest({ body: createBoardSchema }), createBoard);

router.patch('/:boardId', validateRequest({ body: updateBoardSchema }), updateBoard);
router.put('/:boardId/columns', validateRequest({ body: updateBoardColumnsSchema }), updateBoardColumns);
router.delete('/:boardId', deleteBoard);

export default router;
