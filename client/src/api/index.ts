import { apiClient } from './client.js';
import {
  User,
  Workspace,
  WorkspaceMember,
  Project,
  Board,
  Task,
  Comment,
  Notification,
  ActivityLog,
  DashboardOverview,
} from '../types/index.js';

// Auth API
export const authApi = {
  register: (data: any) => apiClient.post('/auth/register', data).then((res) => res.data),
  login: (data: any) => apiClient.post('/auth/login', data).then((res) => res.data),
  logout: () => apiClient.post('/auth/logout').then((res) => res.data),
  getMe: () => apiClient.get('/auth/me').then((res) => res.data),
  forgotPassword: (data: { email: string }) => apiClient.post('/auth/forgot-password', data).then((res) => res.data),
  resetPassword: (data: any) => apiClient.post('/auth/reset-password', data).then((res) => res.data),
};

// Users API
export const usersApi = {
  getProfile: () => apiClient.get('/users/me').then((res) => res.data.data),
  updateProfile: (data: any) => apiClient.patch('/users/me', data).then((res) => res.data.data),
  changePassword: (data: any) => apiClient.patch('/users/me/password', data).then((res) => res.data),
};

// Workspaces API
export const workspacesApi = {
  list: () => apiClient.get('/workspaces').then((res) => res.data.data as Workspace[]),
  create: (data: { name: string; description?: string }) =>
    apiClient.post('/workspaces', data).then((res) => res.data.data as Workspace),
  get: (workspaceId: string) =>
    apiClient.get(`/workspaces/${workspaceId}`).then((res) => res.data.data as Workspace),
  update: (workspaceId: string, data: any) =>
    apiClient.patch(`/workspaces/${workspaceId}`, data).then((res) => res.data.data as Workspace),
  delete: (workspaceId: string) => apiClient.delete(`/workspaces/${workspaceId}`).then((res) => res.data),
  listMembers: (workspaceId: string) =>
    apiClient.get(`/workspaces/${workspaceId}/members`).then((res) => res.data.data as WorkspaceMember[]),
  inviteMember: (workspaceId: string, data: { email: string; role: string }) =>
    apiClient.post(`/workspaces/${workspaceId}/invitations`, data).then((res) => res.data.data),
  acceptInvitation: (token: string) =>
    apiClient.post(`/workspaces/invitations/${token}/accept`).then((res) => res.data.data),
  updateMemberRole: (workspaceId: string, userId: string, role: string) =>
    apiClient.patch(`/workspaces/${workspaceId}/members/${userId}`, { role }).then((res) => res.data.data),
  removeMember: (workspaceId: string, userId: string) =>
    apiClient.delete(`/workspaces/${workspaceId}/members/${userId}`).then((res) => res.data),
};

// Projects API
export const projectsApi = {
  listByWorkspace: (workspaceId: string, params?: any) =>
    apiClient.get(`/projects/workspace/${workspaceId}`, { params }).then((res) => res.data.data as Project[]),
  create: (workspaceId: string, data: any) =>
    apiClient.post(`/projects/workspace/${workspaceId}`, data).then((res) => res.data.data as Project),
  get: (projectId: string) => apiClient.get(`/projects/${projectId}`).then((res) => res.data.data as Project),
  update: (projectId: string, data: any) =>
    apiClient.patch(`/projects/${projectId}`, data).then((res) => res.data.data as Project),
  delete: (projectId: string) => apiClient.delete(`/projects/${projectId}`).then((res) => res.data),
  addMember: (projectId: string, data: { userId: string; role: string }) =>
    apiClient.post(`/projects/${projectId}/members`, data).then((res) => res.data.data),
  removeMember: (projectId: string, userId: string) =>
    apiClient.delete(`/projects/${projectId}/members/${userId}`).then((res) => res.data),
};

// Boards API
export const boardsApi = {
  listByProject: (projectId: string) =>
    apiClient.get(`/boards/project/${projectId}`).then((res) => res.data.data as Board[]),
  create: (projectId: string, data: { name: string }) =>
    apiClient.post(`/boards/project/${projectId}`, data).then((res) => res.data.data as Board),
  update: (boardId: string, data: { name: string }) =>
    apiClient.patch(`/boards/${boardId}`, data).then((res) => res.data.data as Board),
  updateColumns: (boardId: string, columns: any[]) =>
    apiClient.put(`/boards/${boardId}/columns`, { columns }).then((res) => res.data.data as Board),
  delete: (boardId: string) => apiClient.delete(`/boards/${boardId}`).then((res) => res.data),
};

// Tasks API
export const tasksApi = {
  listByProject: (projectId: string, params?: any) =>
    apiClient.get(`/tasks/project/${projectId}`, { params }).then((res) => res.data.data as Task[]),
  getMyTasks: (params?: any) =>
    apiClient.get('/tasks/my', { params }).then((res) => res.data.data as Task[]),
  get: (taskId: string) => apiClient.get(`/tasks/${taskId}`).then((res) => res.data.data as Task),
  create: (projectId: string, data: any) =>
    apiClient.post(`/tasks/project/${projectId}`, data).then((res) => res.data.data as Task),
  update: (taskId: string, data: any) =>
    apiClient.patch(`/tasks/${taskId}`, data).then((res) => res.data.data as Task),
  move: (taskId: string, data: { columnId: string; position: number }) =>
    apiClient.patch(`/tasks/${taskId}/move`, data).then((res) => res.data.data as Task),
  reorder: (tasks: { id: string; columnId: string; position: number }[]) =>
    apiClient.post('/tasks/reorder', { tasks }).then((res) => res.data),
  delete: (taskId: string) => apiClient.delete(`/tasks/${taskId}`).then((res) => res.data),
  // Checklist
  addChecklistItem: (taskId: string, title: string) =>
    apiClient.post(`/tasks/${taskId}/checklist`, { title }).then((res) => res.data.data),
  toggleChecklistItem: (taskId: string, itemId: string) =>
    apiClient.patch(`/tasks/${taskId}/checklist/${itemId}`).then((res) => res.data.data),
  deleteChecklistItem: (taskId: string, itemId: string) =>
    apiClient.delete(`/tasks/${taskId}/checklist/${itemId}`).then((res) => res.data.data),
  // Attachments
  uploadAttachment: (taskId: string, formData: FormData) =>
    apiClient
      .post(`/tasks/${taskId}/attachments`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((res) => res.data.data),
  deleteAttachment: (taskId: string, attachmentId: string) =>
    apiClient.delete(`/tasks/${taskId}/attachments/${attachmentId}`).then((res) => res.data.data),
};

// Comments API
export const commentsApi = {
  listByTask: (taskId: string) =>
    apiClient.get(`/comments/task/${taskId}`).then((res) => res.data.data as Comment[]),
  create: (taskId: string, data: { content: string; parentCommentId?: string | null }) =>
    apiClient.post(`/comments/task/${taskId}`, data).then((res) => res.data.data as Comment),
  update: (commentId: string, content: string) =>
    apiClient.patch(`/comments/${commentId}`, { content }).then((res) => res.data.data as Comment),
  delete: (commentId: string) => apiClient.delete(`/comments/${commentId}`).then((res) => res.data),
};

// Notifications API
export const notificationsApi = {
  list: (params?: { page?: number; limit?: number }) =>
    apiClient.get('/notifications', { params }).then((res) => res.data.data as { notifications: Notification[]; unreadCount: number }),
  markAsRead: (notificationId: string) =>
    apiClient.patch(`/notifications/${notificationId}/read`).then((res) => res.data.data),
  markAllAsRead: () => apiClient.post('/notifications/read-all').then((res) => res.data),
};

// Activity API
export const activityApi = {
  getAdminPlatformOverview: () => apiClient.get('/activity/admin/overview').then((res) => res.data.data),
  getWorkspaceActivity: (workspaceId: string, limit?: number) =>
    apiClient.get(`/activity/workspace/${workspaceId}`, { params: { limit } }).then((res) => res.data.data as ActivityLog[]),
  getProjectActivity: (projectId: string, limit?: number) =>
    apiClient.get(`/activity/project/${projectId}`, { params: { limit } }).then((res) => res.data.data as ActivityLog[]),
  getTaskActivity: (taskId: string) =>
    apiClient.get(`/activity/task/${taskId}`).then((res) => res.data.data as ActivityLog[]),
};

// Search API
export const searchApi = {
  search: (workspaceId: string, query: string) =>
    apiClient
      .get('/search', { params: { workspaceId, q: query } })
      .then((res) => res.data.data as { projects: Project[]; tasks: Task[]; members: any[] }),
};

// Reports API
export const reportsApi = {
  getOverview: (workspaceId: string) =>
    apiClient.get('/reports/overview', { params: { workspaceId } }).then((res) => res.data.data as DashboardOverview),
  getTasks: (workspaceId: string) =>
    apiClient.get('/reports/tasks', { params: { workspaceId } }).then((res) => res.data.data),
  getExportUrl: (workspaceId: string, projectId?: string) => {
    const base = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    return `${base}/reports/export?workspaceId=${workspaceId}${projectId ? `&projectId=${projectId}` : ''}`;
  },
};


