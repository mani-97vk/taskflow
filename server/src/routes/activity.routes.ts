import { Router } from 'express';
import {
  getWorkspaceActivity,
  getProjectActivity,
  getTaskActivity,
  getAdminPlatformOverview,
} from '../controllers/activity.controller.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);

router.get('/admin/overview', getAdminPlatformOverview);
router.get('/workspace/:workspaceId', getWorkspaceActivity);
router.get('/project/:projectId', getProjectActivity);
router.get('/task/:taskId', getTaskActivity);

export default router;
