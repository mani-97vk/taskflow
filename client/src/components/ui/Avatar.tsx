import React, { useState } from 'react';
import { cn } from '../../utils/cn.js';
import { User } from '../../types/index.js';

interface AvatarProps {
  user?: Partial<User> | null;
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export function Avatar({ user, name, size = 'sm', className }: AvatarProps) {
  const [imageError, setImageError] = useState(false);
  const displayName = name || user?.name || user?.email || '?';
  const avatarUrl = user?.avatarUrl;

  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  // Generate deterministic pastel color based on name
  const colors = [
    'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300',
    'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300',
    'bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300',
    'bg-rose-100 text-rose-700 dark:bg-rose-900/60 dark:text-rose-300',
    'bg-purple-100 text-purple-700 dark:bg-purple-900/60 dark:text-purple-300',
    'bg-sky-100 text-sky-700 dark:bg-sky-900/60 dark:text-sky-300',
  ];

  let hash = 0;
  for (let i = 0; i < displayName.length; i++) {
    hash = displayName.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colorIndex = Math.abs(hash) % colors.length;

  const sizes = {
    xs: 'w-5 h-5 text-[10px]',
    sm: 'w-7 h-7 text-xs',
    md: 'w-9 h-9 text-sm',
    lg: 'w-11 h-11 text-base',
    xl: 'w-14 h-14 text-lg font-semibold',
  };

  return (
    <div
      title={displayName}
      className={cn(
        'relative inline-flex items-center justify-center font-medium rounded-full overflow-hidden select-none shrink-0 ring-1 ring-white dark:ring-slate-900',
        sizes[size],
        colors[colorIndex],
        className
      )}
    >
      {avatarUrl && !imageError ? (
        <img
          src={avatarUrl}
          alt={displayName}
          className="w-full h-full object-cover"
          onError={() => setImageError(true)}
        />
      ) : (
        <span>{initials}</span>
      )}
    </div>
  );
}

export function AvatarGroup({ users, max = 3, size = 'sm' }: { users: User[]; max?: number; size?: 'xs' | 'sm' | 'md' }) {
  const visible = users.slice(0, max);
  const remaining = users.length - max;

  return (
    <div className="flex items-center -space-x-2 overflow-hidden">
      {visible.map((u, i) => (
        <Avatar key={u._id || u.id || i} user={u} size={size} className="ring-2 ring-white dark:ring-slate-900" />
      ))}
      {remaining > 0 && (
        <div
          className={cn(
            'inline-flex items-center justify-center rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium ring-2 ring-white dark:ring-slate-900 select-none',
            size === 'xs' ? 'w-5 h-5 text-[9px]' : size === 'sm' ? 'w-7 h-7 text-[11px]' : 'w-9 h-9 text-xs'
          )}
        >
          +{remaining}
        </div>
      )}
    </div>
  );
}
