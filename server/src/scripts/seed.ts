import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { User } from '../models/User.js';
import { Workspace } from '../models/Workspace.js';
import { WorkspaceMember } from '../models/WorkspaceMember.js';
import { Project } from '../models/Project.js';
import { Board } from '../models/Board.js';
import { Task } from '../models/Task.js';
import { Comment } from '../models/Comment.js';
import { Notification } from '../models/Notification.js';
import { ActivityLog } from '../models/ActivityLog.js';
import { hashPassword } from '../utils/password.js';
import { ROLES, PROJECT_STATUS, TASK_PRIORITY } from '../config/constants.js';

async function seed() {
  console.log('🌱 Starting TaskFlow database seed...');
  await mongoose.connect(env.MONGODB_URI);
  console.log('Connected to MongoDB');

  // Check if demo user already exists
  let demoUser = await User.findOne({ email: 'alex@taskflow.dev' });
  if (!demoUser) {
    const passwordHash = await hashPassword('Password123!');
    demoUser = await User.create({
      name: 'Alex Rivera',
      email: 'alex@taskflow.dev',
      passwordHash,
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      bio: 'Product Lead & Full Stack Architect',
      themePreference: 'system',
    });
    console.log('Created demo user: alex@taskflow.dev (password: Password123!)');
  }

  let teammate = await User.findOne({ email: 'sarah@taskflow.dev' });
  if (!teammate) {
    const passwordHash = await hashPassword('Password123!');
    teammate = await User.create({
      name: 'Sarah Chen',
      email: 'sarah@taskflow.dev',
      passwordHash,
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
      bio: 'Senior Frontend Engineer',
      themePreference: 'light',
    });
    console.log('Created teammate: sarah@taskflow.dev (password: Password123!)');
  }

  // Create Demo Workspace
  let workspace = await Workspace.findOne({ slug: 'taskflow-hq' });
  if (!workspace) {
    workspace = await Workspace.create({
      name: 'TaskFlow HQ',
      slug: 'taskflow-hq',
      description: 'Primary engineering and product collaborative space',
      ownerId: demoUser._id,
    });

    await WorkspaceMember.create({
      workspaceId: workspace._id,
      userId: demoUser._id,
      role: ROLES.OWNER,
    });

    await WorkspaceMember.create({
      workspaceId: workspace._id,
      userId: teammate._id,
      role: ROLES.ADMIN,
    });

    console.log('Created workspace: TaskFlow HQ');
  }

  // Create Demo Project 1
  let project1 = await Project.findOne({ workspaceId: workspace._id, key: 'CORE' });
  if (!project1) {
    project1 = await Project.create({
      workspaceId: workspace._id,
      name: 'Next-Gen Core Platform',
      key: 'CORE',
      description: 'High-performance microservices, real-time sync, and edge deployment architecture',
      ownerId: demoUser._id,
      status: PROJECT_STATUS.ACTIVE,
      priority: TASK_PRIORITY.HIGH,
      startDate: new Date(Date.now() - 14 * 24 * 3600 * 1000),
      dueDate: new Date(Date.now() + 30 * 24 * 3600 * 1000),
      tags: ['Backend', 'Realtime', 'Cloud'],
      members: [
        { userId: demoUser._id, role: ROLES.OWNER },
        { userId: teammate._id, role: ROLES.MEMBER },
      ],
    });

    const board1 = await Board.create({
      projectId: project1._id,
      workspaceId: workspace._id,
      name: 'Sprint Board',
      isDefault: true,
      columns: [
        { id: 'backlog', name: 'Backlog', order: 0, color: '#94a3b8' },
        { id: 'todo', name: 'To Do', order: 1, color: '#3b82f6' },
        { id: 'in_progress', name: 'In Progress', order: 2, color: '#f59e0b' },
        { id: 'in_review', name: 'In Review', order: 3, color: '#8b5cf6' },
        { id: 'done', name: 'Done', order: 4, color: '#10b981' },
      ],
    });

    // Create tasks for project 1
    const task1 = await Task.create({
      workspaceId: workspace._id,
      projectId: project1._id,
      boardId: board1._id,
      columnId: 'in_progress',
      taskNumber: 1,
      title: 'Implement WebSocket bidirectional sync protocol',
      description: 'Establish authenticated rooms for workspace and project task mutations with latency under 50ms.',
      assignees: [demoUser._id, teammate._id],
      creatorId: demoUser._id,
      priority: TASK_PRIORITY.URGENT,
      status: 'in_progress',
      dueDate: new Date(Date.now() + 2 * 24 * 3600 * 1000),
      labels: ['WebSocket', 'Performance'],
      position: 1000,
      checklist: [
        { id: '1', title: 'Setup Socket.IO server authentication', completed: true },
        { id: '2', title: 'Implement room joins and reconnect handling', completed: true },
        { id: '3', title: 'Write load test suite for 1000 concurrent sockets', completed: false },
      ],
    });

    const task2 = await Task.create({
      workspaceId: workspace._id,
      projectId: project1._id,
      boardId: board1._id,
      columnId: 'todo',
      taskNumber: 2,
      title: 'Design responsive Kanban drag-and-drop board',
      description: 'Implement column reordering, smooth drag animations, keyboard navigation, and optimistic UI updates.',
      assignees: [teammate._id],
      creatorId: demoUser._id,
      priority: TASK_PRIORITY.HIGH,
      status: 'todo',
      dueDate: new Date(Date.now() + 5 * 24 * 3600 * 1000),
      labels: ['UI/UX', 'Frontend'],
      position: 1000,
      checklist: [
        { id: '1', title: 'Implement DnD provider and drag handles', completed: false },
        { id: '2', title: 'Add column task count badges', completed: false },
      ],
    });

    const task3 = await Task.create({
      workspaceId: workspace._id,
      projectId: project1._id,
      boardId: board1._id,
      columnId: 'done',
      taskNumber: 3,
      title: 'Configure database schema and indexing strategy',
      description: 'Compound indexes for workspace isolation, user query optimization, and rapid status aggregation.',
      assignees: [demoUser._id],
      creatorId: demoUser._id,
      priority: TASK_PRIORITY.MEDIUM,
      status: 'done',
      completedAt: new Date(),
      labels: ['Database', 'MongoDB'],
      position: 1000,
      checklist: [{ id: '1', title: 'Define Mongoose models and indexes', completed: true }],
    });

    // Add comments
    await Comment.create({
      taskId: task1._id,
      workspaceId: workspace._id,
      projectId: project1._id,
      authorId: teammate._id,
      content: 'I verified the room connection logic with 50 test clients, works seamlessly!',
    });

    await Comment.create({
      taskId: task1._id,
      workspaceId: workspace._id,
      projectId: project1._id,
      authorId: demoUser._id,
      content: 'Awesome! Ready to hook this up to the Kanban board.',
    });

    // Add sample notification
    await Notification.create({
      recipientId: demoUser._id,
      workspaceId: workspace._id,
      projectId: project1._id,
      taskId: task1._id,
      type: 'task_assigned',
      title: 'Assigned to task',
      message: 'You were assigned to CORE-1: Implement WebSocket bidirectional sync protocol',
      read: false,
    });

    // Add sample activity
    await ActivityLog.create({
      workspaceId: workspace._id,
      projectId: project1._id,
      taskId: task1._id,
      actorId: demoUser._id,
      action: 'created task',
      details: { taskNumber: 1, title: task1.title },
    });

    console.log('Created project CORE with tasks, comments, and activity');
  }

  console.log('✅ Seed complete! You can log in with:');
  console.log('   Email: alex@taskflow.dev');
  console.log('   Password: Password123!');
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('Seed error:', err);
  process.exit(1);
});
