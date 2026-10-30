import React from 'react';
import { Search, Filter, X, Calendar, AlertTriangle } from 'lucide-react';
import { useWorkspace } from '../../context/WorkspaceContext.js';

export interface BoardFiltersState {
  search: string;
  assignee: string;
  priority: string;
  dueFilter: string;
}

interface BoardFilterBarProps {
  filters: BoardFiltersState;
  onFilterChange: (filters: BoardFiltersState) => void;
  onReset: () => void;
}

export function BoardFilterBar({ filters, onFilterChange, onReset }: BoardFilterBarProps) {
  const { members } = useWorkspace();

  const hasActiveFilters =
    filters.search.trim().length > 0 ||
    filters.assignee !== '' ||
    filters.priority !== '' ||
    filters.dueFilter !== '';

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs mb-5">
      <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
        {/* Search */}
        <div className="relative min-w-[180px] flex-1 sm:max-w-xs">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Filter tasks..."
            value={filters.search}
            onChange={(e) => onFilterChange({ ...filters, search: e.target.value })}
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>

        {/* Assignee Filter */}
        <select
          value={filters.assignee}
          onChange={(e) => onFilterChange({ ...filters, assignee: e.target.value })}
          className="text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 px-2.5 py-1.5 text-slate-700 dark:text-slate-300 focus:outline-none"
        >
          <option value="">All Assignees</option>
          {members.map((m) => (
            <option key={m._id} value={m.userId._id || m.userId.id}>
              {m.userId.name}
            </option>
          ))}
        </select>

        {/* Priority Filter */}
        <select
          value={filters.priority}
          onChange={(e) => onFilterChange({ ...filters, priority: e.target.value })}
          className="text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 px-2.5 py-1.5 text-slate-700 dark:text-slate-300 focus:outline-none"
        >
          <option value="">All Priorities</option>
          <option value="urgent">Urgent</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>

        {/* Due Date Filter */}
        <select
          value={filters.dueFilter}
          onChange={(e) => onFilterChange({ ...filters, dueFilter: e.target.value })}
          className="text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 px-2.5 py-1.5 text-slate-700 dark:text-slate-300 focus:outline-none"
        >
          <option value="">All Deadlines</option>
          <option value="today">Due Today</option>
          <option value="overdue">Overdue</option>
        </select>
      </div>

      {hasActiveFilters && (
        <button
          onClick={onReset}
          className="flex items-center gap-1 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:underline px-2 py-1 rounded-md"
        >
          <X className="w-3.5 h-3.5" />
          <span>Reset Filters</span>
        </button>
      )}
    </div>
  );
}
