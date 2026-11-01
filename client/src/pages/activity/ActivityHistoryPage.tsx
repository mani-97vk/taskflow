import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { activityApi } from '../../api/index.js';
import { useWorkspace } from '../../context/WorkspaceContext.js';
import { useAuth } from '../../context/AuthContext.js';
import { useSocket } from '../../context/SocketContext.js';
import { History, Sparkles, Clock, ShieldCheck, Users, Briefcase, CheckSquare, Layers } from 'lucide-react';
import { Avatar } from '../../components/ui/Avatar.js';
import { EmptyState } from '../../components/ui/EmptyState.js';
import { CardSkeleton } from '../../components/ui/LoadingSkeleton.js';
import { ActivityLog } from '../../types/index.js';

export function ActivityHistoryPage() {
  const { currentWorkspace } = useWorkspace();
  const { user } = useAuth();
  const { socket } = useSocket();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'workspace' | 'admin'>(user?.isAdmin ? 'admin' : 'workspace');

  const wsId = currentWorkspace?._id || currentWorkspace?.id || '';

  // Workspace-level activities
  const { data: activities = [], isLoading: isWsLoading } = useQuery({
    queryKey: ['workspace-activity', wsId],
    queryFn: () => activityApi.getWorkspaceActivity(wsId, 50),
    enabled: !!wsId && activeTab === 'workspace',
  });

  // Admin platform-wide oversight query
  const { data: adminOverview, isLoading: isAdminLoading } = useQuery({
    queryKey: ['admin-overview'],
    queryFn: () => activityApi.getAdminPlatformOverview(),
    enabled: activeTab === 'admin',
    refetchInterval: 10000, // Refresh every 10 seconds for real-time monitoring
  });

  // Real-time socket event for new activity
  useEffect(() => {
    if (!socket) return;

    const handleNewActivity = (activity: ActivityLog) => {
      queryClient.setQueryData(['workspace-activity', wsId], (old: ActivityLog[] | undefined) => {
        if (!old) return [activity];
        return [activity, ...old.slice(0, 49)];
      });
      queryClient.invalidateQueries({ queryKey: ['admin-overview'] });
    };

    socket.on('activity:new', handleNewActivity);
    return () => {
      socket.off('activity:new', handleNewActivity);
    };
  }, [socket, wsId, queryClient]);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              Activity & Audit Trail
            </h2>
            {user?.isAdmin && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300">
                <ShieldCheck className="w-3.5 h-3.5" />
                Admin Active
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real-time tracking of user actions, tasks, and system events
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab('workspace')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'workspace'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Workspace Activity
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('admin')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'admin'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-purple-700 dark:text-purple-400 hover:text-purple-900 dark:hover:text-purple-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            Admin Oversight (All Users)
          </button>
        </div>
      </div>

      {/* ADMIN PLATFORM OVERSIGHT VIEW */}
      {activeTab === 'admin' && (
        <div className="space-y-6">
          {isAdminLoading ? (
            <div className="space-y-3">
              <CardSkeleton />
              <CardSkeleton />
            </div>
          ) : (
            <>
              {/* Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
                  <div className="flex items-center gap-2 text-slate-500 text-xs font-medium">
                    <Users className="w-4 h-4 text-indigo-500" />
                    <span>Registered Users</span>
                  </div>
                  <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
                    {adminOverview?.stats?.totalUsers || 0}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
                  <div className="flex items-center gap-2 text-slate-500 text-xs font-medium">
                    <Layers className="w-4 h-4 text-purple-500" />
                    <span>Workspaces</span>
                  </div>
                  <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
                    {adminOverview?.stats?.totalWorkspaces || 0}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
                  <div className="flex items-center gap-2 text-slate-500 text-xs font-medium">
                    <Briefcase className="w-4 h-4 text-blue-500" />
                    <span>Projects</span>
                  </div>
                  <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
                    {adminOverview?.stats?.totalProjects || 0}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
                  <div className="flex items-center gap-2 text-slate-500 text-xs font-medium">
                    <CheckSquare className="w-4 h-4 text-emerald-500" />
                    <span>Total Tasks</span>
                  </div>
                  <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
                    {adminOverview?.stats?.totalTasks || 0}
                  </div>
                </div>
              </div>

              {/* All Registered Users Monitor */}
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-purple-600" />
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      User Accounts Overview ({adminOverview?.users?.length || 0})
                    </h3>
                  </div>
                  <span className="text-[11px] text-slate-400">Notice what users are active</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400">
                        <th className="pb-2 font-medium">User</th>
                        <th className="pb-2 font-medium">Email</th>
                        <th className="pb-2 font-medium">Role</th>
                        <th className="pb-2 font-medium">Registered Date</th>
                        <th className="pb-2 font-medium">Last Login</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {adminOverview?.users?.map((u: any) => (
                        <tr key={u._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                          <td className="py-2.5 font-medium text-slate-900 dark:text-slate-100 flex items-center gap-2">
                            <Avatar user={u} size="xs" />
                            <span>{u.name}</span>
                          </td>
                          <td className="py-2.5 text-slate-600 dark:text-slate-400 font-mono text-[11px]">
                            {u.email}
                          </td>
                          <td className="py-2.5">
                            {u.isAdmin || u.email?.includes('admin') ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300">
                                Administrator
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                                User
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 text-slate-500 dark:text-slate-400">
                            {new Date(u.createdAt).toLocaleDateString()}
                          </td>
                          <td className="py-2.5 text-slate-500 dark:text-slate-400">
                            {u.lastLogin
                              ? `${new Date(u.lastLogin).toLocaleDateString()} at ${new Date(u.lastLogin).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                              : 'Never'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Global Activity Audit Stream */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-purple-600" />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    Live Platform Activity Stream (Across All Users)
                  </h3>
                </div>

                {!adminOverview?.activities || adminOverview.activities.length === 0 ? (
                  <EmptyState
                    icon={<History className="w-8 h-8 text-purple-500" />}
                    title="No Platform Activity Logged Yet"
                    description="User activities across all workspaces will show here in real-time."
                  />
                ) : (
                  <div className="relative pl-6 border-l-2 border-purple-200 dark:border-purple-900 space-y-4 my-2">
                    {adminOverview.activities.map((act: any) => (
                      <div key={act._id} className="relative group">
                        <div className="absolute -left-[31px] top-1.5 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-slate-900 bg-purple-600" />
                        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-1.5">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <Avatar user={act.actorId} size="xs" />
                              <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                                {act.actorId?.name || 'User'}
                              </span>
                              <span className="text-xs text-purple-600 dark:text-purple-400 font-medium">
                                {act.action}
                              </span>
                              {act.workspaceId?.name && (
                                <span className="text-[10px] text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-md">
                                  {act.workspaceId.name}
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-400">
                              {new Date(act.createdAt).toLocaleDateString()} {new Date(act.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          {act.details && Object.keys(act.details).length > 0 && (
                            <div className="text-[11px] text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-950 p-2 rounded-xl border border-slate-100 dark:border-slate-800 font-mono">
                              {act.details.title || act.details.email || JSON.stringify(act.details)}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* STANDARD WORKSPACE ACTIVITY VIEW */}
      {activeTab === 'workspace' && (
        <>
          {isWsLoading ? (
            <div className="space-y-3">
              <CardSkeleton />
              <CardSkeleton />
            </div>
          ) : activities.length === 0 ? (
            <EmptyState
              icon={<History className="w-8 h-8 text-indigo-500" />}
              title="No Recent Activity"
              description="Activity logs will appear here as your team creates tasks and collaborates."
            />
          ) : (
            <div className="relative pl-6 border-l-2 border-slate-200 dark:border-slate-800 space-y-6 my-4">
              {activities.map((activity) => (
                <div key={activity._id} className="relative group">
                  <div className="absolute -left-[31px] top-1.5 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-slate-900 bg-indigo-600 dark:bg-indigo-400" />
                  <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Avatar user={activity.actorId} size="xs" />
                        <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                          {activity.actorId?.name || 'User'}
                        </span>
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          {activity.action}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {new Date(activity.createdAt).toLocaleDateString()} at{' '}
                        {new Date(activity.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    {activity.details && Object.keys(activity.details).length > 0 && (
                      <div className="text-[11px] text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 font-mono">
                        {activity.details.taskNumber && (
                          <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                            Task #{activity.details.taskNumber}:{' '}
                          </span>
                        )}
                        {activity.details.title ||
                          activity.details.projectName ||
                          activity.details.commentPreview ||
                          JSON.stringify(activity.details)}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
