import { Router } from 'express';
import { getProfile, updateProfile, changePassword } from '../controllers/users.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validateRequest.js';
import { updateProfileSchema, changePasswordSchema } from '../validators/auth.validator.js';

const router = Router();

router.use(requireAuth);

router.get('/me', getProfile);
router.patch('/me', validateRequest({ body: updateProfileSchema }), updateProfile);
router.patch('/me/password', validateRequest({ body: changePasswordSchema }), changePassword);

export default router;
