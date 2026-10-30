import React, { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { activityApi } from '../../api/index.js';
import { useWorkspace } from '../../context/WorkspaceContext.js';
import { useSocket } from '../../context/SocketContext.js';
import { History, Sparkles, Clock } from 'lucide-react';
import { Avatar } from '../../components/ui/Avatar.js';
import { EmptyState } from '../../components/ui/EmptyState.js';
import { CardSkeleton } from '../../components/ui/LoadingSkeleton.js';
import { ActivityLog } from '../../types/index.js';

export function ActivityHistoryPage() {
  const { currentWorkspace } = useWorkspace();
  const { socket } = useSocket();
  const queryClient = useQueryClient();

  const wsId = currentWorkspace?._id || currentWorkspace?.id || '';

  const { data: activities = [], isLoading } = useQuery({
    queryKey: ['workspace-activity', wsId],
    queryFn: () => activityApi.getWorkspaceActivity(wsId, 50),
    enabled: !!wsId,
  });

  // Real-time socket event for new activity
  useEffect(() => {
    if (!socket) return;

    const handleNewActivity = (activity: ActivityLog) => {
      queryClient.setQueryData(['workspace-activity', wsId], (old: ActivityLog[] | undefined) => {
        if (!old) return [activity];
        return [activity, ...old.slice(0, 49)];
      });
    };

    socket.on('activity:new', handleNewActivity);
    return () => {
      socket.off('activity:new', handleNewActivity);
    };
  }, [socket, wsId, queryClient]);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
          Activity History
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Audit trail of tasks, projects, comments, and member actions in {currentWorkspace?.name}
        </p>
      </div>

      {isLoading ? (
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
              {/* Dot on timeline */}
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

                {/* Details snippet */}
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
    </div>
  );
}
