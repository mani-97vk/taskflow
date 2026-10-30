import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { User } from '../models/User.js';
import { hashPassword, comparePassword } from '../utils/password.js';
import { sendSuccess, sendError } from '../utils/response.js';

export async function getProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      sendError(res, 'User not authenticated', 401);
      return;
    }
    sendSuccess(res, req.user);
  } catch (error) {
    sendError(res, 'Failed to fetch user profile', 500);
  }
}

export async function updateProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      sendError(res, 'User not authenticated', 401);
      return;
    }

    const { name, bio, avatarUrl, themePreference } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) {
      sendError(res, 'User not found', 404);
      return;
    }

    if (name !== undefined) user.name = name;
    if (bio !== undefined) user.bio = bio;
    if (avatarUrl !== undefined) user.avatarUrl = avatarUrl;
    if (themePreference !== undefined) user.themePreference = themePreference;

    await user.save();
    sendSuccess(res, user, 'Profile updated successfully');
  } catch (error) {
    sendError(res, 'Failed to update profile', 500);
  }
}

export async function changePassword(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      sendError(res, 'User not authenticated', 401);
      return;
    }

    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+passwordHash');
    if (!user) {
      sendError(res, 'User not found', 404);
      return;
    }

    const isMatch = await comparePassword(currentPassword, user.passwordHash);
    if (!isMatch) {
      sendError(res, 'Current password does not match', 400);
      return;
    }

    user.passwordHash = await hashPassword(newPassword);
    await user.save();

    sendSuccess(res, null, 'Password changed successfully');
  } catch (error) {
    sendError(res, 'Failed to change password', 500);
  }
}
