import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { reportsApi } from '../../api/index.js';
import { useWorkspace } from '../../context/WorkspaceContext.js';
import { Download, BarChart3, Users, CheckCircle, Clock } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { Button } from '../../components/ui/Button.js';
import { CardSkeleton } from '../../components/ui/LoadingSkeleton.js';
import { EmptyState } from '../../components/ui/EmptyState.js';

export function ReportsPage() {
  const { currentWorkspace } = useWorkspace();
  const wsId = currentWorkspace?._id || currentWorkspace?.id || '';

  const { data: overview, isLoading: isOverviewLoading } = useQuery({
    queryKey: ['reports-overview', wsId],
    queryFn: () => reportsApi.getOverview(wsId),
    enabled: !!wsId,
  });

  const { data: taskReport, isLoading: isTaskReportLoading } = useQuery({
    queryKey: ['reports-tasks', wsId],
    queryFn: () => reportsApi.getTasks(wsId),
    enabled: !!wsId,
  });

  const handleExportCSV = () => {
    const exportUrl = reportsApi.getExportUrl(wsId);
    window.open(exportUrl, '_blank');
  };

  if (isOverviewLoading || isTaskReportLoading) {
    return (
      <div className="space-y-6">
        <CardSkeleton />
        <CardSkeleton />
      </div>
    );
  }

  if (!overview) {
    return <EmptyState title="No Data" description="No report data found for this workspace." />;
  }

  const workload = taskReport?.workload || [];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Reports & Analytics
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Real-time performance analytics, completion rates, and team workload distribution.
          </p>
        </div>

        <Button
          size="sm"
          variant="outline"
          onClick={handleExportCSV}
          icon={<Download className="w-4 h-4" />}
        >
          Export CSV
        </Button>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Overall Completion</span>
            <CheckCircle className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-2">
            <span className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100">
              {overview.totalTasks > 0
                ? `${Math.round((overview.completedTasks / overview.totalTasks) * 100)}%`
                : '0%'}
            </span>
            <p className="text-xs text-slate-400 mt-1">
              {overview.completedTasks} of {overview.totalTasks} tasks completed
            </p>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Tasks in Progress</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2">
            <span className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100">
              {overview.inProgressTasks}
            </span>
            <p className="text-xs text-slate-400 mt-1">Active tasks currently being worked on</p>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Active Projects</span>
            <BarChart3 className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="mt-2">
            <span className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100">
              {overview.activeProjects}
            </span>
            <p className="text-xs text-slate-400 mt-1">Out of {overview.totalProjects} total projects</p>
          </div>
        </div>
      </div>

      {/* Team Workload Chart */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <div>
          <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100">
            Workload by Team Member
          </h3>
          <p className="text-xs text-slate-500">
            Total number of assigned tasks per collaborator
          </p>
        </div>

        <div className="h-72 flex items-center justify-center">
          {workload.length === 0 ? (
            <p className="text-xs text-slate-400">No workload records found</p>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={workload} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <XAxis dataKey="userName" stroke="#94a3b8" fontSize={11} tickLine={false} />
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
                <Bar dataKey="total" name="Total Tasks" fill="#6366f1" radius={[6, 6, 0, 0]} />
                <Bar dataKey="completed" name="Completed" fill="#10b981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Workload Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100">Workload Breakdown</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th className="px-6 py-3 font-semibold">Assignee</th>
                <th className="px-6 py-3 font-semibold">Total Assigned</th>
                <th className="px-6 py-3 font-semibold">In Progress</th>
                <th className="px-6 py-3 font-semibold">Completed</th>
                <th className="px-6 py-3 font-semibold">Completion %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {workload.map((w: any) => {
                const pct = w.total > 0 ? Math.round((w.completed / w.total) * 100) : 0;
                return (
                  <tr key={w.userId || w.userName} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                    <td className="px-6 py-3.5 font-semibold text-slate-900 dark:text-slate-100">
                      {w.userName}
                    </td>
                    <td className="px-6 py-3.5 text-slate-600 dark:text-slate-400">{w.total}</td>
                    <td className="px-6 py-3.5 text-amber-600 dark:text-amber-400 font-medium">
                      {w.inProgress}
                    </td>
                    <td className="px-6 py-3.5 text-emerald-600 dark:text-emerald-400 font-medium">
                      {w.completed}
                    </td>
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{pct}%</span>
                        <div className="w-16 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 rounded-full"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
