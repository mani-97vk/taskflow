import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';

import { ThemeProvider } from './context/ThemeContext.js';
import { AuthProvider } from './context/AuthContext.js';
import { WorkspaceProvider } from './context/WorkspaceContext.js';
import { SocketProvider } from './context/SocketContext.js';

// Layout
import { AppLayout } from './components/layout/AppLayout.js';

// Auth Pages
import { LoginPage } from './pages/auth/LoginPage.js';
import { RegisterPage } from './pages/auth/RegisterPage.js';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage.js';
import { ResetPasswordPage } from './pages/auth/ResetPasswordPage.js';

// Application Pages
import { DashboardPage } from './pages/dashboard/DashboardPage.js';
import { MyTasksPage } from './pages/tasks/MyTasksPage.js';
import { InboxPage } from './pages/inbox/InboxPage.js';
import { ProjectListPage } from './pages/projects/ProjectListPage.js';
import { ProjectDetailPage } from './pages/projects/ProjectDetailPage.js';
import { WorkspaceMembersPage } from './pages/workspace/WorkspaceMembersPage.js';
import { WorkspaceSettingsPage } from './pages/workspace/WorkspaceSettingsPage.js';
import { ReportsPage } from './pages/reports/ReportsPage.js';
import { ActivityHistoryPage } from './pages/activity/ActivityHistoryPage.js';
import { ProfileSettingsPage } from './pages/settings/ProfileSettingsPage.js';

// Misc Pages
import { NotFoundPage, UnauthorizedPage } from './pages/misc/NotFoundPage.js';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 1000 * 60 * 2, // 2 minutes
    },
  },
});

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <WorkspaceProvider>
            <SocketProvider>
              <BrowserRouter>
                <Routes>
                  {/* Public Auth Routes */}
                  <Route path="/auth/login" element={<LoginPage />} />
                  <Route path="/auth/register" element={<RegisterPage />} />
                  <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />
                  <Route path="/auth/reset-password" element={<ResetPasswordPage />} />

                  {/* Authenticated Application Shell */}
                  <Route element={<AppLayout />}>
                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                    <Route path="/dashboard" element={<DashboardPage />} />
                    <Route path="/tasks" element={<MyTasksPage />} />
                    <Route path="/inbox" element={<InboxPage />} />
                    <Route path="/projects" element={<ProjectListPage />} />
                    <Route path="/projects/:projectId" element={<ProjectDetailPage />} />
                    <Route path="/workspace/members" element={<WorkspaceMembersPage />} />
                    <Route path="/workspace/settings" element={<WorkspaceSettingsPage />} />
                    <Route path="/reports" element={<ReportsPage />} />
                    <Route path="/activity" element={<ActivityHistoryPage />} />
                    <Route path="/settings/profile" element={<ProfileSettingsPage />} />
                  </Route>

                  {/* Error & Not Found Routes */}
                  <Route path="/unauthorized" element={<UnauthorizedPage />} />
                  <Route path="*" element={<NotFoundPage />} />
                </Routes>
              </BrowserRouter>

              <Toaster position="top-right" richColors closeButton />
            </SocketProvider>
          </WorkspaceProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
