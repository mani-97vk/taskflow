import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { workspacesApi } from '../../api/index.js';
import { useWorkspace } from '../../context/WorkspaceContext.js';
import { useAuth } from '../../context/AuthContext.js';
import { Button } from '../../components/ui/Button.js';
import { Input } from '../../components/ui/Input.js';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog.js';
import { toast } from 'sonner';
import { Trash2, ShieldAlert } from 'lucide-react';

export function WorkspaceSettingsPage() {
  const { currentWorkspace, userRole, reloadWorkspaces } = useWorkspace();
  const queryClient = useQueryClient();

  const [name, setName] = useState(currentWorkspace?.name || '');
  const [description, setDescription] = useState(currentWorkspace?.description || '');
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);

  const wsId = currentWorkspace?._id || currentWorkspace?.id || '';
  const isOwner = userRole === 'owner';

  const updateMutation = useMutation({
    mutationFn: () => workspacesApi.update(wsId, { name, description }),
    onSuccess: () => {
      reloadWorkspaces();
      toast.success('Workspace updated successfully');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to update workspace');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => workspacesApi.delete(wsId),
    onSuccess: () => {
      toast.success('Workspace deleted');
      window.location.href = '/dashboard';
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to delete workspace');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    updateMutation.mutate();
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
          Workspace Settings
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Configure general details and permissions for {currentWorkspace?.name}
        </p>
      </div>

      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-5">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Workspace Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            disabled={!isOwner && userRole !== 'admin'}
          />

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Description
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={!isOwner && userRole !== 'admin'}
              className="w-full text-xs sm:text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-60"
            />
          </div>

          {(isOwner || userRole === 'admin') && (
            <div className="flex justify-end pt-2">
              <Button type="submit" size="sm" isLoading={updateMutation.isPending}>
                Save Changes
              </Button>
            </div>
          )}
        </form>
      </div>

      {/* Danger Zone: Delete Workspace */}
      {isOwner && (
        <div className="p-6 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/60 space-y-4">
          <div className="flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-sm text-rose-700 dark:text-rose-400">
                Delete Workspace
              </h4>
              <p className="text-xs text-rose-600/80 dark:text-rose-400/80 leading-relaxed mt-0.5">
                Permanently delete this workspace and all associated projects, tasks, boards, comments, and member records.
              </p>
            </div>
          </div>

          <Button
            variant="danger"
            size="sm"
            onClick={() => setIsConfirmDeleteOpen(true)}
            icon={<Trash2 className="w-4 h-4" />}
          >
            Delete Workspace
          </Button>
        </div>
      )}

      <ConfirmDialog
        isOpen={isConfirmDeleteOpen}
        onClose={() => setIsConfirmDeleteOpen(false)}
        onConfirm={() => deleteMutation.mutate()}
        title="Delete Entire Workspace"
        message={`Are you absolutely sure you want to permanently delete "${currentWorkspace?.name}"? All projects, tasks, and data will be destroyed.`}
        confirmLabel="Permanently Delete Workspace"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
