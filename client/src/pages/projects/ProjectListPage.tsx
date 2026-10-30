import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { projectsApi } from '../../api/index.js';
import { useWorkspace } from '../../context/WorkspaceContext.js';
import { Link } from 'react-router-dom';
import {
  FolderGit2,
  Plus,
  Search,
  Calendar,
  AlertTriangle,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { PriorityBadge, StatusBadge } from '../../components/ui/Badge.js';
import { Button } from '../../components/ui/Button.js';
import { EmptyState } from '../../components/ui/EmptyState.js';
import { CardSkeleton } from '../../components/ui/LoadingSkeleton.js';
import { GlobalCreateModal } from '../../components/layout/GlobalCreateModal.js';
import { Project } from '../../types/index.js';

export function ProjectListPage() {
  const { currentWorkspace, canManageProjects } = useWorkspace();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const wsId = currentWorkspace?._id || currentWorkspace?.id || '';

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['projects', wsId, search, statusFilter],
    queryFn: () =>
      projectsApi.listByWorkspace(wsId, {
        search: search || undefined,
        status: statusFilter || undefined,
      }),
    enabled: !!wsId,
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Projects
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Organize roadmaps, sprints, and feature deliveries for {currentWorkspace?.name}
          </p>
        </div>

        {canManageProjects && (
          <Button
            size="sm"
            onClick={() => setIsCreateOpen(true)}
            icon={<Plus className="w-4 h-4" />}
          >
            New Project
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search projects by name or key..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 px-3 py-1.5 text-slate-700 dark:text-slate-300 focus:outline-none"
        >
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="planning">Planning</option>
          <option value="on_hold">On Hold</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      {/* Projects Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : projects.length === 0 ? (
        <EmptyState
          icon={<FolderGit2 className="w-8 h-8 text-indigo-500" />}
          title="No Projects Found"
          description="Create your first project to start organizing tasks on Kanban boards."
          actionLabel={canManageProjects ? 'Create Project' : undefined}
          onAction={() => setIsCreateOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {projects.map((project: Project) => {
            const progress = project.progress || 0;
            return (
              <Link
                key={project._id || project.id}
                to={`/projects/${project._id || project.id}`}
                className="group p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-500 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/80 px-2 py-0.5 rounded-md">
                      {project.key}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <PriorityBadge priority={project.priority} size="sm" />
                      <StatusBadge status={project.status} size="sm" />
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold text-base text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {project.name}
                    </h3>
                    {project.description && (
                      <p className="mt-1 text-xs text-slate-500 line-clamp-2 leading-relaxed">
                        {project.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/80 space-y-3">
                  {/* Progress */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] font-medium text-slate-500">
                      <span>Progress</span>
                      <span>{progress}%</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div
                        className="h-full bg-indigo-600 rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Task counts & Overdue */}
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>
                      {project.completedTasks || 0} / {project.totalTasks || 0} tasks done
                    </span>
                    {(project.overdueTasks || 0) > 0 && (
                      <span className="inline-flex items-center gap-1 text-rose-600 dark:text-rose-400 font-semibold text-[11px]">
                        <AlertTriangle className="w-3 h-3" />
                        <span>{project.overdueTasks} overdue</span>
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Global Create Project Modal */}
      <GlobalCreateModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        defaultTab="project"
      />
    </div>
  );
}
