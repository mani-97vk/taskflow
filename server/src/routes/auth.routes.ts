import { Router } from 'express';
import {
  register,
  login,
  logout,
  getMe,
  forgotPassword,
  resetPassword,
} from '../controllers/auth.controller.js';
import { validateRequest } from '../middleware/validateRequest.js';
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '../validators/auth.validator.js';
import { requireAuth } from '../middleware/auth.js';
import { authRateLimiter } from '../middleware/rateLimiter.js';

const router = Router();

router.post('/register', authRateLimiter, validateRequest({ body: registerSchema }), register);
router.post('/login', authRateLimiter, validateRequest({ body: loginSchema }), login);
router.post('/logout', logout);
router.get('/me', requireAuth, getMe);
router.post('/forgot-password', authRateLimiter, validateRequest({ body: forgotPasswordSchema }), forgotPassword);
router.post('/reset-password', authRateLimiter, validateRequest({ body: resetPasswordSchema }), resetPassword);

export default router;
