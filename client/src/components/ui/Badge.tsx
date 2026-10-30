import React from 'react';
import { cn } from '../../utils/cn.js';
import { TaskPriorityType, ProjectStatusType } from '../../types/index.js';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'outline';
  size?: 'sm' | 'md';
}

export function Badge({ className, variant = 'default', size = 'sm', children, ...props }: BadgeProps) {
  const variants = {
    default: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    primary: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/50',
    success: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/50',
    warning: 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/50',
    danger: 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200/60 dark:border-rose-800/50',
    info: 'bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300 border border-sky-200/60 dark:border-sky-800/50',
    outline: 'border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300',
  };

  const sizes = {
    sm: 'text-[11px] font-medium px-2 py-0.5 rounded-md',
    md: 'text-xs font-medium px-2.5 py-1 rounded-md',
  };

  return (
    <span className={cn('inline-flex items-center gap-1 select-none whitespace-nowrap', variants[variant], sizes[size], className)} {...props}>
      {children}
    </span>
  );
}

export function PriorityBadge({ priority, size = 'sm' }: { priority: TaskPriorityType; size?: 'sm' | 'md' }) {
  switch (priority) {
    case 'urgent':
      return <Badge variant="danger" size={size}>Urgent</Badge>;
    case 'high':
      return <Badge variant="warning" size={size}>High</Badge>;
    case 'medium':
      return <Badge variant="info" size={size}>Medium</Badge>;
    case 'low':
    default:
      return <Badge variant="default" size={size}>Low</Badge>;
  }
}

export function StatusBadge({ status, size = 'sm' }: { status: ProjectStatusType | string; size?: 'sm' | 'md' }) {
  switch (status) {
    case 'active':
    case 'in_progress':
      return <Badge variant="warning" size={size}>In Progress</Badge>;
    case 'completed':
    case 'done':
      return <Badge variant="success" size={size}>Done</Badge>;
    case 'in_review':
      return <Badge variant="primary" size={size}>In Review</Badge>;
    case 'todo':
      return <Badge variant="info" size={size}>To Do</Badge>;
    case 'backlog':
    case 'planning':
      return <Badge variant="default" size={size}>Backlog</Badge>;
    case 'on_hold':
      return <Badge variant="danger" size={size}>On Hold</Badge>;
    case 'archived':
      return <Badge variant="outline" size={size}>Archived</Badge>;
    default:
      return <Badge variant="default" size={size}>{status}</Badge>;
  }
}
