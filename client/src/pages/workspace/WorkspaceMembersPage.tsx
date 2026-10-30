import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { workspacesApi } from '../../api/index.js';
import { useWorkspace } from '../../context/WorkspaceContext.js';
import { useAuth } from '../../context/AuthContext.js';
import { Users, UserPlus, Trash2, Shield, Mail } from 'lucide-react';
import { Avatar } from '../../components/ui/Avatar.js';
import { Button } from '../../components/ui/Button.js';
import { Modal } from '../../components/ui/Modal.js';
import { Input } from '../../components/ui/Input.js';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog.js';
import { CardSkeleton } from '../../components/ui/LoadingSkeleton.js';
import { toast } from 'sonner';
import { WorkspaceMember, RoleType } from '../../types/index.js';

export function WorkspaceMembersPage() {
  const { currentWorkspace, canAdmin } = useWorkspace();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('member');
  const [memberToRemove, setMemberToRemove] = useState<WorkspaceMember | null>(null);

  const wsId = currentWorkspace?._id || currentWorkspace?.id || '';

  const { data: members = [], isLoading } = useQuery({
    queryKey: ['workspace-members', wsId],
    queryFn: () => workspacesApi.listMembers(wsId),
    enabled: !!wsId,
  });

  const inviteMutation = useMutation({
    mutationFn: (data: { email: string; role: string }) =>
      workspacesApi.inviteMember(wsId, data),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ['workspace-members', wsId] });
      toast.success('Invitation sent');
      if (res.inviteLink) {
        toast.info(`Development invite link: ${res.inviteLink}`);
      }
      setIsInviteOpen(false);
      setInviteEmail('');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to send invite');
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) =>
      workspacesApi.updateMemberRole(wsId, userId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-members', wsId] });
      toast.success('Member role updated');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to update role');
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: (userId: string) => workspacesApi.removeMember(wsId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-members', wsId] });
      toast.success('Member removed');
      setMemberToRemove(null);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to remove member');
    },
  });

  const handleInviteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    inviteMutation.mutate({ email: inviteEmail.trim(), role: inviteRole });
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Team Members
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Manage who has access to {currentWorkspace?.name} and their administrative roles.
          </p>
        </div>

        {canAdmin && (
          <Button
            size="sm"
            onClick={() => setIsInviteOpen(true)}
            icon={<UserPlus className="w-4 h-4" />}
          >
            Invite Member
          </Button>
        )}
      </div>

      {/* Members Table */}
      {isLoading ? (
        <div className="space-y-3">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs divide-y divide-slate-100 dark:divide-slate-800/80 overflow-hidden">
          {members.map((member: WorkspaceMember) => {
            const memberUser = member.userId;
            const isCurrentUser = memberUser._id === user?.id || memberUser.id === user?.id;
            const isOwner = member.role === 'owner';

            return (
              <div
                key={member._id}
                className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3.5">
                  <Avatar user={memberUser} size="md" />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                        {memberUser.name}
                      </span>
                      {isCurrentUser && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                          You
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-slate-500">{memberUser.email}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {canAdmin && !isOwner ? (
                    <select
                      value={member.role}
                      onChange={(e) =>
                        updateRoleMutation.mutate({
                          userId: memberUser._id || memberUser.id,
                          role: e.target.value,
                        })
                      }
                      className="text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-slate-800 dark:text-slate-200 focus:outline-none"
                    >
                      <option value="admin">Admin</option>
                      <option value="project_manager">Project Manager</option>
                      <option value="member">Member</option>
                      <option value="viewer">Viewer</option>
                    </select>
                  ) : (
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-md">
                      {member.role}
                    </span>
                  )}

                  {canAdmin && !isOwner && !isCurrentUser && (
                    <button
                      onClick={() => setMemberToRemove(member)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg transition-colors"
                      title="Remove member"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Invite Modal */}
      <Modal
        isOpen={isInviteOpen}
        onClose={() => setIsInviteOpen(false)}
        title="Invite New Team Member"
        description="Send an invitation to join this workspace."
        maxWidth="sm"
      >
        <form onSubmit={handleInviteSubmit} className="space-y-4">
          <Input
            type="email"
            label="Email Address *"
            placeholder="colleague@company.com"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            required
            icon={<Mail className="w-4 h-4" />}
          />

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Workspace Role
            </label>
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value)}
              className="w-full text-xs font-medium rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none"
            >
              <option value="admin">Admin (Full settings & members)</option>
              <option value="project_manager">Project Manager (Projects & tasks)</option>
              <option value="member">Member (Create & edit tasks)</option>
              <option value="viewer">Viewer (Read-only)</option>
            </select>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2.5">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsInviteOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" isLoading={inviteMutation.isPending}>
              Send Invitation
            </Button>
          </div>
        </form>
      </Modal>

      {/* Remove Member Confirmation */}
      {memberToRemove && (
        <ConfirmDialog
          isOpen={!!memberToRemove}
          onClose={() => setMemberToRemove(null)}
          onConfirm={() =>
            removeMemberMutation.mutate(
              memberToRemove.userId._id || memberToRemove.userId.id
            )
          }
          title="Remove Member"
          message={`Are you sure you want to remove ${memberToRemove.userId.name} from ${currentWorkspace?.name}? They will lose access to all projects in this workspace.`}
          confirmLabel="Remove Member"
          isLoading={removeMemberMutation.isPending}
        />
      )}
    </div>
  );
}
