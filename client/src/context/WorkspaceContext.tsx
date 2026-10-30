import React, { createContext, useContext, useState, useEffect } from 'react';
import { Workspace, WorkspaceMember, RoleType } from '../types/index.js';
import { workspacesApi } from '../api/index.js';
import { useAuth } from './AuthContext.js';

interface WorkspaceContextType {
  currentWorkspace: Workspace | null;
  workspaces: Workspace[];
  members: WorkspaceMember[];
  userRole: RoleType | null;
  isLoading: boolean;
  canAdmin: boolean;
  canManageProjects: boolean;
  canEdit: boolean;
  switchWorkspace: (workspaceId: string) => void;
  reloadWorkspaces: () => Promise<void>;
  reloadMembers: () => Promise<void>;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const { user, workspaces: authWorkspaces, refreshUser } = useAuth();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null);
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    if (authWorkspaces && authWorkspaces.length > 0) {
      setWorkspaces(authWorkspaces);
      const savedWsId = localStorage.getItem('taskflow_active_workspace');
      const active =
        authWorkspaces.find((w) => w._id === savedWsId || w.id === savedWsId) ||
        authWorkspaces[0];
      setCurrentWorkspace(active);
      setIsLoading(false);
    } else {
      setWorkspaces([]);
      setCurrentWorkspace(null);
      setIsLoading(false);
    }
  }, [authWorkspaces]);

  const reloadMembers = async () => {
    if (!currentWorkspace) return;
    try {
      const wsId = currentWorkspace._id || currentWorkspace.id!;
      const memberList = await workspacesApi.listMembers(wsId);
      setMembers(memberList);
    } catch (e) {
      console.error('Failed to load workspace members:', e);
    }
  };

  useEffect(() => {
    if (currentWorkspace) {
      const wsId = currentWorkspace._id || currentWorkspace.id!;
      localStorage.setItem('taskflow_active_workspace', wsId);
      reloadMembers();
    }
  }, [currentWorkspace]);

  const switchWorkspace = (workspaceId: string) => {
    const found = workspaces.find((w) => w._id === workspaceId || w.id === workspaceId);
    if (found) {
      setCurrentWorkspace(found);
      localStorage.setItem('taskflow_active_workspace', workspaceId);
    }
  };

  const reloadWorkspaces = async () => {
    await refreshUser();
  };

  const currentMember = members.find(
    (m) =>
      (typeof m.userId === 'object' && m.userId._id === user?.id) ||
      m.userId?.id === user?.id ||
      (m.userId as any) === user?.id
  );

  const userRole: RoleType | null =
    currentMember?.role || (currentWorkspace?.role as RoleType) || null;

  const canAdmin = userRole === 'owner' || userRole === 'admin';
  const canManageProjects = canAdmin || userRole === 'project_manager';
  const canEdit = canManageProjects || userRole === 'member';

  return (
    <WorkspaceContext.Provider
      value={{
        currentWorkspace,
        workspaces,
        members,
        userRole,
        isLoading,
        canAdmin,
        canManageProjects,
        canEdit,
        switchWorkspace,
        reloadWorkspaces,
        reloadMembers,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
}
