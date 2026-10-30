import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { tasksApi } from '../../api/index.js';
import { useWorkspace } from '../../context/WorkspaceContext.js';
import { useOutletContext } from 'react-router-dom';
import { Search, Calendar, CheckSquare, AlertTriangle, Clock, CheckCircle } from 'lucide-react';
import { PriorityBadge, StatusBadge } from '../../components/ui/Badge.js';
import { AvatarGroup } from '../../components/ui/Avatar.js';
import { EmptyState } from '../../components/ui/EmptyState.js';
import { CardSkeleton } from '../../components/ui/LoadingSkeleton.js';
import { Task } from '../../types/index.js';

export function MyTasksPage() {
  const { currentWorkspace } = useWorkspace();
  const context = useOutletContext<{ onOpenTask?: (taskId: string) => void }>();
  const onOpenTask = context?.onOpenTask;

  const [activeTab, setActiveTab] = useState<'assigned' | 'created' | 'today' | 'upcoming' | 'overdue' | 'completed'>('assigned');
  const [search, setSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');

  const wsId = currentWorkspace?._id || currentWorkspace?.id || '';

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['my-tasks', wsId, activeTab, priorityFilter, search],
    queryFn: () =>
      tasksApi.getMyTasks({
        workspaceId: wsId,
        view: activeTab,
        priority: priorityFilter || undefined,
        search: search || undefined,
      }),
    enabled: !!wsId,
  });

  const tabs = [
    { id: 'assigned', label: 'Assigned to Me', icon: CheckSquare },
    { id: 'today', label: 'Due Today', icon: Clock },
    { id: 'upcoming', label: 'Upcoming', icon: Calendar },
    { id: 'overdue', label: 'Overdue', icon: AlertTriangle },
    { id: 'completed', label: 'Completed', icon: CheckCircle },
    { id: 'created', label: 'Created by Me', icon: CheckSquare },
  ];

  return (
    <div className="space-y-6">
      {/* Header & Tabs */}
      <div className="space-y-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            My Tasks
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Keep track of everything assigned to you and meet your deadlines.
          </p>
        </div>

        {/* View Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-slate-200 dark:border-slate-800">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200 dark:shadow-none'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search within my tasks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>

        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 px-3 py-1.5 text-slate-700 dark:text-slate-300 focus:outline-none"
        >
          <option value="">All Priorities</option>
          <option value="urgent">Urgent</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>

      {/* Task List */}
      {isLoading ? (
        <div className="space-y-3">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : tasks.length === 0 ? (
        <EmptyState
          icon={<CheckSquare className="w-8 h-8 text-indigo-500" />}
          title="No Tasks Found"
          description={
            activeTab === 'overdue'
              ? 'Great job! You have no overdue tasks.'
              : 'No tasks match the selected view and filter criteria.'
          }
        />
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden divide-y divide-slate-100 dark:divide-slate-800/80">
          {tasks.map((task: Task) => {
            const isOverdue =
              task.dueDate &&
              new Date(task.dueDate) < new Date() &&
              task.columnId !== 'done';

            return (
              <div
                key={task._id}
                onClick={() => onOpenTask && onOpenTask(task._id)}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 cursor-pointer transition-colors"
              >
                <div className="space-y-1 flex-1 min-w-0 pr-4">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                      {(task.projectId as any)?.key || 'TF'}-{task.taskNumber}
                    </span>
                    <span className="text-slate-300 dark:text-slate-700">·</span>
                    <span className="text-xs text-slate-500 truncate">
                      {(task.projectId as any)?.name || 'Project'}
                    </span>
                  </div>

                  <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                    {task.title}
                  </h4>

                  {task.description && (
                    <p className="text-xs text-slate-500 line-clamp-1">{task.description}</p>
                  )}
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {task.dueDate && (
                    <span
                      className={`inline-flex items-center gap-1 text-xs font-medium ${
                        isOverdue
                          ? 'text-rose-600 dark:text-rose-400 font-semibold'
                          : 'text-slate-500'
                      }`}
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{new Date(task.dueDate).toLocaleDateString()}</span>
                    </span>
                  )}

                  <PriorityBadge priority={task.priority} />
                  <StatusBadge status={task.columnId} />

                  {task.assignees && task.assignees.length > 0 && (
                    <AvatarGroup users={task.assignees} max={2} size="xs" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
