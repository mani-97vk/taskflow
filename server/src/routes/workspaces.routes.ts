import { Router } from 'express';
import {
  listWorkspaces,
  createWorkspace,
  getWorkspace,
  updateWorkspace,
  deleteWorkspace,
  listMembers,
  inviteMember,
  acceptInvitation,
  updateMemberRole,
  removeMember,
} from '../controllers/workspaces.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { requireWorkspaceMember } from '../middleware/workspaceAuth.js';
import { validateRequest } from '../middleware/validateRequest.js';
import {
  createWorkspaceSchema,
  updateWorkspaceSchema,
  inviteMemberSchema,
  updateMemberRoleSchema,
} from '../validators/workspace.validator.js';
import { ROLES } from '../config/constants.js';

const router = Router();

router.use(requireAuth);

router.get('/', listWorkspaces);
router.post('/', validateRequest({ body: createWorkspaceSchema }), createWorkspace);
router.post('/invitations/:token/accept', acceptInvitation);

router.get('/:workspaceId', requireWorkspaceMember(ROLES.VIEWER), getWorkspace);
router.patch(
  '/:workspaceId',
  requireWorkspaceMember(ROLES.ADMIN),
  validateRequest({ body: updateWorkspaceSchema }),
  updateWorkspace
);
router.delete('/:workspaceId', requireWorkspaceMember(ROLES.OWNER), deleteWorkspace);

router.get('/:workspaceId/members', requireWorkspaceMember(ROLES.VIEWER), listMembers);
router.post(
  '/:workspaceId/invitations',
  requireWorkspaceMember(ROLES.ADMIN),
  validateRequest({ body: inviteMemberSchema }),
  inviteMember
);
router.patch(
  '/:workspaceId/members/:userId',
  requireWorkspaceMember(ROLES.ADMIN),
  validateRequest({ body: updateMemberRoleSchema }),
  updateMemberRole
);
router.delete('/:workspaceId/members/:userId', requireWorkspaceMember(ROLES.ADMIN), removeMember);

export default router;
