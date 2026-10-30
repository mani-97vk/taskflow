export const ROLES = {
  OWNER: 'owner',
  ADMIN: 'admin',
  PROJECT_MANAGER: 'project_manager',
  MEMBER: 'member',
  VIEWER: 'viewer',
} as const;

export type RoleType = typeof ROLES[keyof typeof ROLES];

export const PROJECT_STATUS = {
  PLANNING: 'planning',
  ACTIVE: 'active',
  ON_HOLD: 'on_hold',
  COMPLETED: 'completed',
  ARCHIVED: 'archived',
} as const;

export type ProjectStatusType = typeof PROJECT_STATUS[keyof typeof PROJECT_STATUS];

export const TASK_PRIORITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent',
} as const;

export type TaskPriorityType = typeof TASK_PRIORITY[keyof typeof TASK_PRIORITY];

export const NOTIFICATION_TYPE = {
  TASK_ASSIGNED: 'task_assigned',
  TASK_STATUS_CHANGED: 'task_status_changed',
  TASK_DEADLINE_APPROACHING: 'task_deadline_approaching',
  COMMENT_ADDED: 'comment_added',
  USER_MENTIONED: 'user_mentioned',
  PROJECT_INVITATION: 'project_invitation',
  WORKSPACE_INVITATION: 'workspace_invitation',
} as const;

export type NotificationType = typeof NOTIFICATION_TYPE[keyof typeof NOTIFICATION_TYPE];
