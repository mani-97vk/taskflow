import { Router } from 'express';
import {
  listProjects,
  createProject,
  getProject,
  updateProject,
  deleteProject,
  addProjectMember,
  removeProjectMember,
} from '../controllers/projects.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { requireWorkspaceMember } from '../middleware/workspaceAuth.js';
import { validateRequest } from '../middleware/validateRequest.js';
import {
  createProjectSchema,
  updateProjectSchema,
  addProjectMemberSchema,
} from '../validators/project.validator.js';
import { ROLES } from '../config/constants.js';

const router = Router();

router.use(requireAuth);

// Workspace-scoped project routes
router.get(
  '/workspace/:workspaceId',
  requireWorkspaceMember(ROLES.VIEWER),
  listProjects
);
router.post(
  '/workspace/:workspaceId',
  requireWorkspaceMember(ROLES.MEMBER),
  validateRequest({ body: createProjectSchema }),
  createProject
);

// Direct project routes
router.get('/:projectId', getProject);
router.patch('/:projectId', validateRequest({ body: updateProjectSchema }), updateProject);
router.delete('/:projectId', deleteProject);

router.post(
  '/:projectId/members',
  validateRequest({ body: addProjectMemberSchema }),
  addProjectMember
);
router.delete('/:projectId/members/:userId', removeProjectMember);

export default router;
