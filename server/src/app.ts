import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import path from 'path';
import fs from 'fs';
import { env } from './config/env.js';
import { errorHandler } from './middleware/errorHandler.js';
import { generalRateLimiter } from './middleware/rateLimiter.js';

// Import Routes
import healthRoutes from './routes/health.routes.js';
import authRoutes from './routes/auth.routes.js';
import usersRoutes from './routes/users.routes.js';
import workspacesRoutes from './routes/workspaces.routes.js';
import projectsRoutes from './routes/projects.routes.js';
import boardsRoutes from './routes/boards.routes.js';
import tasksRoutes from './routes/tasks.routes.js';
import commentsRoutes from './routes/comments.routes.js';
import notificationsRoutes from './routes/notifications.routes.js';
import activityRoutes from './routes/activity.routes.js';
import searchRoutes from './routes/search.routes.js';
import reportsRoutes from './routes/reports.routes.js';

export const app = express();

// Security HTTP headers (disable CSP so Vite SPA inline scripts & styles run cleanly)
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// CORS setup (allow incoming requests and reflect origin for seamless auth)
app.use(
  cors({
    origin: (incomingOrigin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or same-origin)
      if (!incomingOrigin) return callback(null, true);
      return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Parsers
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Apply general rate limiting to API endpoints
app.use('/api', generalRateLimiter);

// Serve static uploads
const uploadPath = path.resolve(process.cwd(), env.UPLOAD_DIR);
app.use('/uploads', express.static(uploadPath));

// API Routes
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/workspaces', workspacesRoutes);
app.use('/api/projects', projectsRoutes);
app.use('/api/boards', boardsRoutes);
app.use('/api/tasks', tasksRoutes);
app.use('/api/comments', commentsRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/activity', activityRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/reports', reportsRoutes);

// Locate frontend build directory (check server/public, client/dist, etc.)
const possibleClientPaths = [
  path.resolve(process.cwd(), 'public'),
  path.resolve(process.cwd(), 'dist/public'),
  path.resolve(process.cwd(), '../client/dist'),
  path.resolve(process.cwd(), 'client/dist'),
  path.resolve(__dirname, '../public'),
  path.resolve(__dirname, '../../public'),
  path.resolve(__dirname, '../../client/dist'),
];

const clientDistDir = possibleClientPaths.find(
  (p) => fs.existsSync(p) && fs.existsSync(path.join(p, 'index.html'))
);

if (clientDistDir) {
  app.use(express.static(clientDistDir));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
      return next();
    }
    res.sendFile(path.join(clientDistDir, 'index.html'));
  });
} else {
  // If static directory not present, provide informative API landing page
  app.get('/', (_req, res) => {
    res.json({
      status: 'online',
      service: 'TaskFlow Collaborative Management API',
      version: '1.0.0',
      message: 'Server is active and accepting connections.',
      endpoints: {
        health: '/api/health',
        auth: '/api/auth/me',
      },
    });
  });
}

// Centralized error handler
app.use(errorHandler);
