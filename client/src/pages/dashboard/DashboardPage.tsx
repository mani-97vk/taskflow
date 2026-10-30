import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { reportsApi } from '../../api/index.js';
import { useWorkspace } from '../../context/WorkspaceContext.js';
import { useAuth } from '../../context/AuthContext.js';
import {
  FolderGit2,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Sparkles,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Link, useOutletContext } from 'react-router-dom';
import { PriorityBadge } from '../../components/ui/Badge.js';
import { CardSkeleton } from '../../components/ui/LoadingSkeleton.js';
import { EmptyState } from '../../components/ui/EmptyState.js';

export function DashboardPage() {
  const { currentWorkspace } = useWorkspace();
  const { user } = useAuth();
  const context = useOutletContext<{ onOpenTask?: (taskId: string) => void }>();
  const onOpenTask = context?.onOpenTask;

  const wsId = currentWorkspace?._id || currentWorkspace?.id || '';

  const { data: overview, isLoading } = useQuery({
    queryKey: ['dashboard', wsId],
    queryFn: () => reportsApi.getOverview(wsId),
    enabled: !!wsId,
  });

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </div>
    );
  }

  if (!overview) {
    return (
      <EmptyState
        title="No Workspace Data"
        description="Select or create a workspace to view dashboard analytics."
      />
    );
  }

  const statCards = [
    {
      title: 'Active Projects',
      value: overview.activeProjects,
      total: overview.totalProjects,
      subtitle: `${overview.totalProjects} total projects`,
      icon: FolderGit2,
      color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 dark:text-indigo-400',
    },
    {
      title: 'Tasks in Progress',
      value: overview.inProgressTasks,
      total: overview.totalTasks,
      subtitle: `${overview.totalTasks} total tasks`,
      icon: Clock,
      color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/60 dark:text-amber-400',
    },
    {
      title: 'Completed Tasks',
      value: overview.completedTasks,
      subtitle:
        overview.totalTasks > 0
          ? `${Math.round((overview.completedTasks / overview.totalTasks) * 100)}% overall completion`
          : '0% completed',
      icon: CheckCircle2,
      color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 dark:text-emerald-400',
    },
    {
      title: 'Overdue Tasks',
      value: overview.overdueTasks,
      subtitle: 'Requiring immediate action',
      icon: AlertTriangle,
      color: 'text-rose-600 bg-rose-50 dark:bg-rose-950/60 dark:text-rose-400',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-violet-700 text-white shadow-lg shadow-indigo-200/50 dark:shadow-none">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-xs font-semibold backdrop-blur-sm mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Workspace: {currentWorkspace?.name}</span>
          </span>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
            Welcome back, {user?.name?.split(' ')[0]} 👋
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-indigo-100/90">
            You have <span className="font-bold underline">{overview.assignedToMe}</span> tasks assigned to you.
          </p>
        </div>

        <Link
          to="/tasks"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-indigo-700 text-xs sm:text-sm font-semibold hover:bg-indigo-50 transition-colors shadow-sm"
        >
          <span>View My Tasks</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Metric KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div
              key={i}
              className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{card.title}</span>
                <div className={`p-2 rounded-xl ${card.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <span className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100">
                  {card.value}
                </span>
                <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">{card.subtitle}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Analytics Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution Pie Chart */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100">Tasks by Status</h3>
              <p className="text-xs text-slate-500">Live breakdown across columns</p>
            </div>
          </div>

          <div className="h-64 flex items-center justify-center">
            {overview.totalTasks === 0 ? (
              <p className="text-xs text-slate-400">No tasks in this workspace yet</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={overview.statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {overview.statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      borderRadius: '8px',
                      border: 'none',
                      color: '#fff',
                      fontSize: '12px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Status Legends */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
            {overview.statusData.map((item) => (
              <div key={item.name} className="flex items-center gap-1.5 text-xs">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-slate-600 dark:text-slate-400">{item.name}:</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Priority Distribution Bar Chart */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100">Tasks by Priority</h3>
              <p className="text-xs text-slate-500">Urgency classification</p>
            </div>
          </div>

          <div className="h-64 flex items-center justify-center">
            {overview.totalTasks === 0 ? (
              <p className="text-xs text-slate-400">No tasks in this workspace yet</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={overview.priorityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      borderRadius: '8px',
                      border: 'none',
                      color: '#fff',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {overview.priorityData.map((entry, index) => (
                      <Cell key={`bar-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
            {overview.priorityData.map((item) => (
              <div key={item.name} className="flex items-center gap-1.5 text-xs">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-slate-600 dark:text-slate-400">{item.name}:</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Projects Progress & Upcoming Deadlines */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Project Progress */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100">Project Progress</h3>
            <Link to="/projects" className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
              View all
            </Link>
          </div>

          {overview.projectsWithProgress.length === 0 ? (
            <p className="text-xs text-center py-8 text-slate-400">No active projects</p>
          ) : (
            <div className="space-y-4">
              {overview.projectsWithProgress.map((project) => (
                <div key={project.id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <Link
                      to={`/projects/${project.id}`}
                      className="font-semibold text-slate-800 dark:text-slate-200 hover:text-indigo-600 truncate"
                    >
                      {project.name} ({project.key})
                    </Link>
                    <span className="text-slate-500 font-medium">{project.progress}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-indigo-600 rounded-full transition-all duration-300"
                      style={{ width: `${project.progress}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>{project.done} done</span>
                    <span>{project.total} total</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming Deadlines */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100">Upcoming Deadlines</h3>
            <Link to="/tasks" className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
              View my tasks
            </Link>
          </div>

          {overview.upcomingDeadlines.length === 0 ? (
            <p className="text-xs text-center py-8 text-slate-400">No upcoming task deadlines</p>
          ) : (
            <div className="space-y-2.5">
              {overview.upcomingDeadlines.map((task) => (
                <div
                  key={task._id}
                  onClick={() => onOpenTask && onOpenTask(task._id)}
                  className="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/40 hover:bg-indigo-50/40 cursor-pointer transition-colors"
                >
                  <div className="space-y-0.5 truncate flex-1 pr-2">
                    <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate block">
                      {task.title}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {(task.projectId as any)?.name || 'Project'} · Due {new Date(task.dueDate!).toLocaleDateString()}
                    </span>
                  </div>
                  <PriorityBadge priority={task.priority} size="sm" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
