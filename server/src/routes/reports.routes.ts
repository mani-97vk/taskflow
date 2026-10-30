import { Router } from 'express';
import { getOverview, getTaskReport, exportCSV } from '../controllers/reports.controller.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);

router.get('/overview', getOverview);
router.get('/tasks', getTaskReport);
router.get('/export', exportCSV);

export default router;
