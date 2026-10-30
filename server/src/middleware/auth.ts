import { Request, Response, NextFunction } from 'express';
import { verifyToken, TokenPayload } from '../utils/jwt.js';
import { User, IUser } from '../models/User.js';
import { sendError } from '../utils/response.js';

export interface AuthenticatedRequest extends Request {
  user?: IUser;
  tokenPayload?: TokenPayload;
  workspaceMember?: any;
  workspace?: any;
}

export async function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    let token: string | undefined;

    // Check cookie
    if (req.cookies && req.cookies.auth_token) {
      token = req.cookies.auth_token;
    }

    // Check Authorization header (Bearer <token>)
    if (!token && req.headers.authorization) {
      const parts = req.headers.authorization.split(' ');
      if (parts.length === 2 && parts[0] === 'Bearer') {
        token = parts[1];
      }
    }

    if (!token) {
      sendError(res, 'Authentication required. Please log in.', 401);
      return;
    }

    const payload = verifyToken(token);
    if (!payload) {
      sendError(res, 'Session expired or invalid token. Please log in again.', 401);
      return;
    }

    const user = await User.findById(payload.userId);
    if (!user) {
      sendError(res, 'User account no longer exists.', 401);
      return;
    }

    req.user = user;
    req.tokenPayload = payload;
    next();
  } catch (error) {
    sendError(res, 'Authentication verification failed', 401);
  }
}
