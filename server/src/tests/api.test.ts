import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { app } from '../app.js';
import { env } from '../config/env.js';

describe('TaskFlow API Integration Tests', () => {
  let authToken = '';
  let workspaceId = '';
  let projectId = '';
  let taskId = '';
  let commentId = '';

  const testEmail = `testuser_${Date.now()}@taskflow.dev`;
  const testPassword = 'Password123!';

  beforeAll(async () => {
    await mongoose.connect(env.MONGODB_URI);
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  describe('Health Check', () => {
    it('GET /api/health should return 200 and healthy status', async () => {
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('healthy');
      expect(res.body.database).toBe('connected');
    });
  });

  describe('Authentication Endpoints', () => {
    it('POST /api/auth/register should register a new user and create default workspace', async () => {
      const res = await request(app).post('/api/auth/register').send({
        name: 'Test Tester',
        email: testEmail,
        password: testPassword,
      });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe(testEmail);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.defaultWorkspaceId).toBeDefined();

      authToken = res.body.data.token;
      workspaceId = res.body.data.defaultWorkspaceId;
    });

    it('POST /api/auth/register should reject duplicate email', async () => {
      const res = await request(app).post('/api/auth/register').send({
        name: 'Duplicate',
        email: testEmail,
        password: testPassword,
      });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
    });

    it('POST /api/auth/login should reject invalid credentials', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: testEmail,
        password: 'WrongPassword!',
      });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('POST /api/auth/login should log in successfully with valid credentials', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: testEmail,
        password: testPassword,
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
    });

    it('GET /api/auth/me should return current user profile and workspaces', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.user.email).toBe(testEmail);
      expect(res.body.data.workspaces.length).toBeGreaterThan(0);
    });

    it('GET /api/auth/me should reject unauthenticated requests with 401', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
    });
  });

  describe('Workspaces Endpoints', () => {
    it('GET /api/workspaces should list user workspaces', async () => {
      const res = await request(app)
        .get('/api/workspaces')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    it('GET /api/workspaces/:workspaceId should return workspace details', async () => {
      const res = await request(app)
        .get(`/api/workspaces/${workspaceId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.name).toBeDefined();
    });
  });

  describe('Project Endpoints', () => {
    it('POST /api/projects/workspace/:workspaceId should create a project with a default Kanban board', async () => {
      const projectKey = `T${Date.now().toString().slice(-4)}`;
      const res = await request(app)
        .post(`/api/projects/workspace/${workspaceId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Core System API',
          key: projectKey,
          description: 'Microservice API project for testing',
          priority: 'high',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.key).toBe(projectKey);
      expect(res.body.data.defaultBoardId).toBeDefined();

      projectId = res.body.data._id;
    });

    it('GET /api/projects/:projectId should return project details', async () => {
      const res = await request(app)
        .get(`/api/projects/${projectId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('Core System API');
    });

    it('PATCH /api/projects/:projectId should update project details', async () => {
      const res = await request(app)
        .patch(`/api/projects/${projectId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Core System API v2',
          priority: 'urgent',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('Core System API v2');
      expect(res.body.data.priority).toBe('urgent');
    });
  });

  describe('Task and Board Endpoints', () => {
    it('POST /api/tasks/project/:projectId should create a new task', async () => {
      const res = await request(app)
        .post(`/api/tasks/project/${projectId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          columnId: 'todo',
          title: 'Design API Gateway',
          description: 'Draft the routing table and JWT verification',
          priority: 'high',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe('Design API Gateway');
      expect(res.body.data.taskNumber).toBe(1);

      taskId = res.body.data._id;
    });

    it('GET /api/tasks/project/:projectId should return project tasks', async () => {
      const res = await request(app)
        .get(`/api/tasks/project/${projectId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].title).toBe('Design API Gateway');
    });

    it('PATCH /api/tasks/:taskId/move should update task column and position', async () => {
      const res = await request(app)
        .patch(`/api/tasks/${taskId}/move`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          columnId: 'in_progress',
          position: 2000,
        });

      expect(res.status).toBe(200);
      expect(res.body.data.columnId).toBe('in_progress');
      expect(res.body.data.position).toBe(2000);
    });

    it('POST /api/tasks/:taskId/checklist should add a checklist item', async () => {
      const res = await request(app)
        .post(`/api/tasks/${taskId}/checklist`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Review rate limiting rules',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].title).toBe('Review rate limiting rules');
    });
  });

  describe('Comments Endpoints', () => {
    it('POST /api/comments/task/:taskId should add a comment', async () => {
      const res = await request(app)
        .post(`/api/comments/task/${taskId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          content: 'This task is ready for technical review.',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.content).toBe('This task is ready for technical review.');
      commentId = res.body.data._id;
    });

    it('GET /api/comments/task/:taskId should list comments', async () => {
      const res = await request(app)
        .get(`/api/comments/task/${taskId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
    });
  });

  describe('Reports and CSV Export', () => {
    it('GET /api/reports/overview should return real aggregated metrics', async () => {
      const res = await request(app)
        .get(`/api/reports/overview?workspaceId=${workspaceId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.totalProjects).toBeGreaterThanOrEqual(1);
      expect(res.body.data.totalTasks).toBeGreaterThanOrEqual(1);
      expect(res.body.data.statusData).toBeDefined();
    });

    it('GET /api/reports/export should export valid CSV', async () => {
      const res = await request(app)
        .get(`/api/reports/export?workspaceId=${workspaceId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('text/csv');
      expect(res.text).toContain('Task ID');
      expect(res.text).toContain('Design API Gateway');
    });
  });

  describe('Logout Endpoint', () => {
    it('POST /api/auth/logout should clear session cookie', async () => {
      const res = await request(app).post('/api/auth/logout');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
