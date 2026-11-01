export type RoleType = 'owner' | 'admin' | 'project_manager' | 'member' | 'viewer';
export type ProjectStatusType = 'planning' | 'active' | 'on_hold' | 'completed' | 'archived';
export type TaskPriorityType = 'low' | 'medium' | 'high' | 'urgent';

export interface User {
  id: string;
  _id?: string;
  name: string;
  email: string;
  avatarUrl?: string;
  bio?: string;
  themePreference?: 'light' | 'dark' | 'system';
  isAdmin?: boolean;
}

export interface Workspace {
  _id: string;
  id?: string;
  name: string;
  slug: string;
  description?: string;
  ownerId: string | User;
  role?: RoleType;
  memberCount?: number;
  projectCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface WorkspaceMember {
  _id: string;
  workspaceId: string;
  userId: User;
  role: RoleType;
  joinedAt: string;
}

export interface BoardColumn {
  id: string;
  name: string;
  order: number;
  color?: string;
  taskLimit?: number;
}

export interface Board {
  _id: string;
  projectId: string;
  workspaceId: string;
  name: string;
  isDefault: boolean;
  columns: BoardColumn[];
  createdAt: string;
  updatedAt: string;
}

export interface ChecklistItem {
  id: string;
  title: string;
  completed: boolean;
  completedAt?: string;
}

export interface Attachment {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  path: string;
  uploadedBy: User;
  uploadedAt: string;
}

export interface Task {
  _id: string;
  id?: string;
  workspaceId: string;
  projectId: string | { _id: string; name: string; key: string };
  boardId: string;
  columnId: string;
  taskNumber: number;
  title: string;
  description?: string;
  assignees: User[];
  creatorId: User;
  priority: TaskPriorityType;
  status: string;
  startDate?: string;
  dueDate?: string;
  labels: string[];
  estimatedEffort?: number;
  actualEffort?: number;
  position: number;
  parentTaskId?: string | { _id: string; title: string; taskNumber: number };
  checklist: ChecklistItem[];
  attachments: Attachment[];
  completedAt?: string;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  _id: string;
  id?: string;
  workspaceId: string;
  name: string;
  key: string;
  description?: string;
  ownerId: User;
  status: ProjectStatusType;
  priority: TaskPriorityType;
  startDate?: string;
  dueDate?: string;
  tags: string[];
  visibility: 'workspace' | 'private';
  members: { userId: User; role: RoleType }[];
  isArchived: boolean;
  totalTasks?: number;
  completedTasks?: number;
  overdueTasks?: number;
  progress?: number;
  stats?: {
    totalTasks: number;
    completedTasks: number;
    overdueTasks: number;
    progress: number;
  };
  defaultBoardId?: string;
  columns?: BoardColumn[];
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  _id: string;
  taskId: string;
  workspaceId: string;
  projectId: string;
  authorId: User;
  content: string;
  parentCommentId?: string;
  isEdited: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  _id: string;
  recipientId: string;
  workspaceId: string;
  projectId?: string;
  taskId?: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  actionUrl?: string;
  createdAt: string;
}

export interface ActivityLog {
  _id: string;
  workspaceId: string;
  projectId?: { _id: string; name: string; key: string };
  taskId?: { _id: string; title: string; taskNumber: number };
  actorId: User;
  action: string;
  details?: Record<string, any>;
  createdAt: string;
}

export interface DashboardOverview {
  totalProjects: number;
  activeProjects: number;
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  overdueTasks: number;
  assignedToMe: number;
  statusData: { name: string; value: number; color: string }[];
  priorityData: { name: string; value: number; color: string }[];
  projectsWithProgress: { id: string; name: string; key: string; total: number; done: number; progress: number }[];
  upcomingDeadlines: Task[];
}

