import React, { useState } from 'react';
import { Modal } from '../ui/Modal.js';
import { Button } from '../ui/Button.js';
import { Input } from '../ui/Input.js';
import { FolderPlus, CheckSquare, UserPlus } from 'lucide-react';
import { useWorkspace } from '../../context/WorkspaceContext.js';
import { projectsApi, tasksApi, workspacesApi } from '../../api/index.js';
import { toast } from 'sonner';
import { useQueryClient, useQuery } from '@tanstack/react-query';

interface GlobalCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'task' | 'project' | 'invite';
}

export function GlobalCreateModal({ isOpen, onClose, defaultTab = 'task' }: GlobalCreateModalProps) {
  const { currentWorkspace, canManageProjects } = useWorkspace();
  const [tab, setTab] = useState<'task' | 'project' | 'invite'>(defaultTab);
  const [isLoading, setIsLoading] = useState(false);
  const queryClient = useQueryClient();

  const wsId = currentWorkspace?._id || currentWorkspace?.id || '';

  // Load projects for task creation
  const { data: projects = [] } = useQuery({
    queryKey: ['projects', wsId],
    queryFn: () => projectsApi.listByWorkspace(wsId),
    enabled: !!wsId && isOpen,
  });

  // Task form state
  const [taskData, setTaskData] = useState({
    projectId: '',
    title: '',
    description: '',
    priority: 'medium',
    dueDate: '',
  });

  // Project form state
  const [projectData, setProjectData] = useState({
    name: '',
    key: '',
    description: '',
    priority: 'medium',
  });

  // Invite form state
  const [inviteData, setInviteData] = useState({
    email: '',
    role: 'member',
  });

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskData.projectId) {
      toast.error('Please select a project');
      return;
    }
    if (!taskData.title.trim()) {
      toast.error('Task title is required');
      return;
    }

    try {
      setIsLoading(true);
      await tasksApi.create(taskData.projectId, {
        title: taskData.title,
        description: taskData.description,
        priority: taskData.priority,
        columnId: 'todo',
        dueDate: taskData.dueDate ? new Date(taskData.dueDate).toISOString() : undefined,
      });
      toast.success('Task created successfully');
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      onClose();
      setTaskData({ projectId: '', title: '', description: '', priority: 'medium', dueDate: '' });
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create task');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectData.name.trim() || !projectData.key.trim()) {
      toast.error('Project name and key are required');
      return;
    }

    try {
      setIsLoading(true);
      await projectsApi.create(wsId, {
        name: projectData.name,
        key: projectData.key.toUpperCase(),
        description: projectData.description,
        priority: projectData.priority,
      });
      toast.success('Project created successfully');
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      onClose();
      setProjectData({ name: '', key: '', description: '', priority: 'medium' });
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create project');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteData.email.trim()) {
      toast.error('Email is required');
      return;
    }

    try {
      setIsLoading(true);
      const res = await workspacesApi.inviteMember(wsId, {
        email: inviteData.email,
        role: inviteData.role,
      });
      toast.success('Invitation sent successfully');
      if (res.inviteLink) {
        toast.info(`Invite link generated: ${res.inviteLink}`);
      }
      onClose();
      setInviteData({ email: '', role: 'member' });
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to send invite');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="md">
      {/* Tabs */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/70 rounded-xl mb-5">
        <button
          type="button"
          onClick={() => setTab('task')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition-all ${
            tab === 'task'
              ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <CheckSquare className="w-4 h-4" />
          <span>New Task</span>
        </button>

        {canManageProjects && (
          <button
            type="button"
            onClick={() => setTab('project')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition-all ${
              tab === 'project'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <FolderPlus className="w-4 h-4" />
            <span>New Project</span>
          </button>
        )}

        <button
          type="button"
          onClick={() => setTab('invite')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition-all ${
            tab === 'invite'
              ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <UserPlus className="w-4 h-4" />
          <span>Invite Member</span>
        </button>
      </div>

      {/* Task Form */}
      {tab === 'task' && (
        <form onSubmit={handleCreateTask} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Select Project *
            </label>
            <select
              value={taskData.projectId}
              onChange={(e) => setTaskData({ ...taskData, projectId: e.target.value })}
              className="w-full text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              required
            >
              <option value="">-- Choose a project --</option>
              {projects.map((p) => (
                <option key={p._id || p.id} value={p._id || p.id}>
                  {p.name} ({p.key})
                </option>
              ))}
            </select>
          </div>

          <Input
            label="Task Title *"
            placeholder="e.g. Implement user settings screen"
            value={taskData.title}
            onChange={(e) => setTaskData({ ...taskData, title: e.target.value })}
            required
          />

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Description
            </label>
            <textarea
              rows={3}
              value={taskData.description}
              onChange={(e) => setTaskData({ ...taskData, description: e.target.value })}
              placeholder="Add key objectives or context..."
              className="w-full text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Priority
              </label>
              <select
                value={taskData.priority}
                onChange={(e) => setTaskData({ ...taskData, priority: e.target.value })}
                className="w-full text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            <Input
              type="date"
              label="Due Date"
              value={taskData.dueDate}
              onChange={(e) => setTaskData({ ...taskData, dueDate: e.target.value })}
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2.5">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" size="sm" isLoading={isLoading}>
              Create Task
            </Button>
          </div>
        </form>
      )}

      {/* Project Form */}
      {tab === 'project' && (
        <form onSubmit={handleCreateProject} className="space-y-4">
          <Input
            label="Project Name *"
            placeholder="e.g. Mobile App Redesign"
            value={projectData.name}
            onChange={(e) => {
              const name = e.target.value;
              const autoKey = name.replace(/[^A-Za-z0-9]/g, '').slice(0, 4).toUpperCase();
              setProjectData({ ...projectData, name, key: projectData.key || autoKey });
            }}
            required
          />

          <Input
            label="Project Key (2-10 characters) *"
            placeholder="e.g. MOB"
            value={projectData.key}
            onChange={(e) => setProjectData({ ...projectData, key: e.target.value.toUpperCase() })}
            maxLength={10}
            required
            helperText="Short prefix for tasks (e.g. MOB-1, MOB-2)"
          />

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Description
            </label>
            <textarea
              rows={3}
              value={projectData.description}
              onChange={(e) => setProjectData({ ...projectData, description: e.target.value })}
              placeholder="What is this project aiming to accomplish?"
              className="w-full text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2.5">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" size="sm" isLoading={isLoading}>
              Create Project
            </Button>
          </div>
        </form>
      )}

      {/* Invite Member Form */}
      {tab === 'invite' && (
        <form onSubmit={handleInvite} className="space-y-4">
          <Input
            type="email"
            label="Colleague Email *"
            placeholder="teammate@company.com"
            value={inviteData.email}
            onChange={(e) => setInviteData({ ...inviteData, email: e.target.value })}
            required
          />

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Workspace Role
            </label>
            <select
              value={inviteData.role}
              onChange={(e) => setInviteData({ ...inviteData, role: e.target.value })}
              className="w-full text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="admin">Admin (Manage settings & members)</option>
              <option value="project_manager">Project Manager (Create projects & tasks)</option>
              <option value="member">Member (Create and update tasks)</option>
              <option value="viewer">Viewer (Read-only)</option>
            </select>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2.5">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" size="sm" isLoading={isLoading}>
              Send Invitation
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
