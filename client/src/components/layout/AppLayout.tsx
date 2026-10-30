import React, { useState, useEffect } from 'react';
import { Outlet, useLocation, Navigate } from 'react-router-dom';
import { Sidebar } from './Sidebar.js';
import { Header } from './Header.js';
import { useAuth } from '../../context/AuthContext.js';
import { useWorkspace } from '../../context/WorkspaceContext.js';
import { useSocket } from '../../context/SocketContext.js';
import { TaskDetailModal } from '../task/TaskDetailModal.js';
import { EmptyState } from '../ui/EmptyState.js';
import { Workflow } from 'lucide-react';

export function AppLayout() {
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const { currentWorkspace, isLoading: isWsLoading, workspaces } = useWorkspace();
  const { joinWorkspace, leaveWorkspace } = useSocket();
  const location = useLocation();

  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem('taskflow_sidebar_collapsed') === 'true';
  });
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('taskflow_sidebar_collapsed', String(next));
      return next;
    });
  };

  // Join workspace socket room
  useEffect(() => {
    if (currentWorkspace) {
      const wsId = currentWorkspace._id || currentWorkspace.id!;
      joinWorkspace(wsId);
      return () => {
        leaveWorkspace(wsId);
      };
    }
  }, [currentWorkspace]);

  // Close mobile sidebar on route change
  useEffect(() => {
    setIsMobileOpen(false);
  }, [location.pathname]);

  if (isAuthLoading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white animate-pulse">
          <Workflow className="w-6 h-6" />
        </div>
        <p className="mt-3 text-xs font-semibold text-slate-500">Loading TaskFlow...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  // Get current page title based on route
  const getPageTitle = () => {
    const p = location.pathname;
    if (p.startsWith('/dashboard')) return 'Dashboard';
    if (p.startsWith('/tasks')) return 'My Tasks';
    if (p.startsWith('/inbox')) return 'Inbox & Notifications';
    if (p.startsWith('/projects')) return 'Projects';
    if (p.startsWith('/workspace/members')) return 'Team Members';
    if (p.startsWith('/workspace/settings')) return 'Workspace Settings';
    if (p.startsWith('/reports')) return 'Reports & Analytics';
    if (p.startsWith('/activity')) return 'Activity History';
    if (p.startsWith('/settings/profile')) return 'Profile Settings';
    return '';
  };

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* Sidebar */}
      <Sidebar
        isCollapsed={isCollapsed}
        onToggleCollapse={toggleCollapse}
        isMobileOpen={isMobileOpen}
        onCloseMobile={() => setIsMobileOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          onToggleMobileSidebar={() => setIsMobileOpen(true)}
          title={getPageTitle()}
          onOpenTask={(taskId) => setSelectedTaskId(taskId)}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {!isWsLoading && workspaces.length === 0 ? (
            <EmptyState
              icon={<Workflow className="w-8 h-8 text-indigo-500" />}
              title="No Workspace Available"
              description="Create your first workspace to start collaborating on projects and tasks."
              actionLabel="Create Workspace"
              onAction={() => window.location.reload()}
            />
          ) : (
            <Outlet context={{ onOpenTask: (taskId: string) => setSelectedTaskId(taskId) }} />
          )}
        </main>
      </div>

      {/* Global Task Details Modal */}
      {selectedTaskId && (
        <TaskDetailModal
          taskId={selectedTaskId}
          isOpen={!!selectedTaskId}
          onClose={() => setSelectedTaskId(null)}
        />
      )}
    </div>
  );
}
