import React, { useState } from 'react';
import { useParams, useNavigate, Link, useOutletContext } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectsApi, boardsApi } from '../../api/index.js';
import { useWorkspace } from '../../context/WorkspaceContext.js';
import {
  Kanban,
  List,
  Users,
  Settings as SettingsIcon,
  Plus,
  Trash2,
  Archive,
  Calendar,
  AlertCircle,
} from 'lucide-react';
import { KanbanBoard } from '../../components/board/KanbanBoard.js';
import { PriorityBadge, StatusBadge } from '../../components/ui/Badge.js';
import { Avatar, AvatarGroup } from '../../components/ui/Avatar.js';
import { Button } from '../../components/ui/Button.js';
import { Input } from '../../components/ui/Input.js';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog.js';
import { BoardSkeleton } from '../../components/ui/LoadingSkeleton.js';
import { toast } from 'sonner';
import { Project, Board } from '../../types/index.js';

export function ProjectDetailPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { members: workspaceMembers, canAdmin } = useWorkspace();
  const context = useOutletContext<{ onOpenTask?: (taskId: string) => void }>();
  const onOpenTask = context?.onOpenTask;

  const [activeTab, setActiveTab] = useState<'board' | 'list' | 'members' | 'settings'>('board');
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);

  // Fetch project details
  const { data: project, isLoading: isProjectLoading } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => projectsApi.get(projectId!),
    enabled: !!projectId,
  });

  // Fetch project boards
  const { data: boards = [], isLoading: isBoardsLoading } = useQuery({
    queryKey: ['boards', projectId],
    queryFn: () => boardsApi.listByProject(projectId!),
    enabled: !!projectId,
  });

  // Delete project mutation
  const deleteProjectMutation = useMutation({
    mutationFn: () => projectsApi.delete(projectId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Project deleted successfully');
      navigate('/projects');
    },
    onError: () => toast.error('Failed to delete project'),
  });

  // Update project settings
  const updateProjectMutation = useMutation({
    mutationFn: (data: any) => projectsApi.update(projectId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Project updated');
    },
  });

  if (isProjectLoading || isBoardsLoading) {
    return <BoardSkeleton />;
  }

  if (!project) {
    return (
      <div className="p-12 text-center text-sm text-slate-500">
        Project not found or access denied.
      </div>
    );
  }

  const defaultBoard: Board = boards[0] || {
    _id: 'default',
    projectId: project._id,
    workspaceId: project.workspaceId,
    name: 'Main Board',
    isDefault: true,
    columns: project.columns || [
      { id: 'backlog', name: 'Backlog', order: 0, color: '#94a3b8' },
      { id: 'todo', name: 'To Do', order: 1, color: '#3b82f6' },
      { id: 'in_progress', name: 'In Progress', order: 2, color: '#f59e0b' },
      { id: 'in_review', name: 'In Review', order: 3, color: '#8b5cf6' },
      { id: 'done', name: 'Done', order: 4, color: '#10b981' },
    ],
    createdAt: '',
    updatedAt: '',
  };

  return (
    <div className="space-y-6">
      {/* Project Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="space-y-2">
          <div className="flex items-center gap-2.5">
            <Link
              to="/projects"
              className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-medium"
            >
              Projects
            </Link>
            <span className="text-slate-300 dark:text-slate-700">/</span>
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/80 px-2 py-0.5 rounded-md">
              {project.key}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              {project.name}
            </h2>
            <PriorityBadge priority={project.priority} />
            <StatusBadge status={project.status} />
          </div>

          {project.description && (
            <p className="text-xs text-slate-500 max-w-2xl">{project.description}</p>
          )}
        </div>

        {/* Project Meta / Progress */}
        <div className="flex items-center gap-4 border-t md:border-t-0 md:border-l border-slate-100 dark:border-slate-800 pt-3 md:pt-0 md:pl-6 shrink-0">
          <div className="text-right">
            <div className="text-xs font-semibold text-slate-900 dark:text-slate-100">
              {project.stats?.progress || 0}% Complete
            </div>
            <div className="text-[11px] text-slate-400">
              {project.stats?.completedTasks || 0} / {project.stats?.totalTasks || 0} tasks done
            </div>
          </div>
        </div>
      </div>

      {/* View Sub-Tabs */}
      <div className="flex items-center gap-1.5 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('board')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'board'
              ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200 dark:shadow-none'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Kanban className="w-3.5 h-3.5" />
          <span>Kanban Board</span>
        </button>

        <button
          onClick={() => setActiveTab('members')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'members'
              ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200 dark:shadow-none'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Members ({project.members?.length || 0})</span>
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'settings'
              ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200 dark:shadow-none'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <SettingsIcon className="w-3.5 h-3.5" />
          <span>Settings</span>
        </button>
      </div>

      {/* Kanban Board View */}
      {activeTab === 'board' && (
        <KanbanBoard
          board={defaultBoard}
          projectId={project._id}
          projectKey={project.key}
          onOpenTask={(taskId) => onOpenTask && onOpenTask(taskId)}
        />
      )}

      {/* Members Tab */}
      {activeTab === 'members' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100">Project Members</h3>
              <p className="text-xs text-slate-500">Collaborators assigned to this project</p>
            </div>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {project.members?.map((m: any) => (
              <div key={m.userId._id || m.userId.id} className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar user={m.userId} size="sm" />
                  <div>
                    <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">{m.userId.name}</p>
                    <p className="text-[11px] text-slate-400">{m.userId.email}</p>
                  </div>
                </div>

                <span className="text-xs uppercase tracking-wider font-semibold text-slate-500">
                  {m.role}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <div className="space-y-6 max-w-2xl">
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-4">
            <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100">Project Details</h3>

            <div className="space-y-4">
              <Input
                label="Project Name"
                defaultValue={project.name}
                onBlur={(e) => {
                  if (e.target.value.trim() && e.target.value !== project.name) {
                    updateProjectMutation.mutate({ name: e.target.value });
                  }
                }}
              />

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Description
                </label>
                <textarea
                  rows={3}
                  defaultValue={project.description || ''}
                  onBlur={(e) => {
                    if (e.target.value !== (project.description || '')) {
                      updateProjectMutation.mutate({ description: e.target.value });
                    }
                  }}
                  className="w-full text-xs sm:text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Status
                  </label>
                  <select
                    defaultValue={project.status}
                    onChange={(e) => updateProjectMutation.mutate({ status: e.target.value })}
                    className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  >
                    <option value="planning">Planning</option>
                    <option value="active">Active</option>
                    <option value="on_hold">On Hold</option>
                    <option value="completed">Completed</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Priority
                  </label>
                  <select
                    defaultValue={project.priority}
                    onChange={(e) => updateProjectMutation.mutate({ priority: e.target.value })}
                    className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Danger Zone */}
          {canAdmin && (
            <div className="p-6 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/60 space-y-4">
              <div>
                <h4 className="font-semibold text-sm text-rose-700 dark:text-rose-400">Danger Zone</h4>
                <p className="text-xs text-rose-600/80 dark:text-rose-400/80">
                  Deleting a project permanently removes all tasks, boards, comments, and attachments.
                </p>
              </div>

              <Button
                variant="danger"
                size="sm"
                onClick={() => setIsConfirmDeleteOpen(true)}
                icon={<Trash2 className="w-4 h-4" />}
              >
                Delete Project
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isConfirmDeleteOpen}
        onClose={() => setIsConfirmDeleteOpen(false)}
        onConfirm={() => deleteProjectMutation.mutate()}
        title="Delete Project"
        message={`Are you sure you want to permanently delete "${project.name}" (${project.key})? This action cannot be undone.`}
        confirmLabel="Permanently Delete"
        isLoading={deleteProjectMutation.isPending}
      />
    </div>
  );
}
