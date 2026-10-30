import React, { useState } from 'react';
import { Droppable } from '@hello-pangea/dnd';
import { Plus, X } from 'lucide-react';
import { TaskCard } from './TaskCard.js';
import { BoardColumn as IBoardColumn, Task } from '../../types/index.js';

interface BoardColumnProps {
  column: IBoardColumn;
  tasks: Task[];
  projectKey: string;
  onOpenTask: (taskId: string) => void;
  onQuickCreateTask: (columnId: string, title: string) => Promise<void>;
}

export function BoardColumn({
  column,
  tasks,
  projectKey,
  onOpenTask,
  onQuickCreateTask,
}: BoardColumnProps) {
  const [isQuickCreateOpen, setIsQuickCreateOpen] = useState(false);
  const [quickTitle, setQuickTitle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTitle.trim()) return;

    try {
      setIsSubmitting(true);
      await onQuickCreateTask(column.id, quickTitle.trim());
      setQuickTitle('');
      setIsQuickCreateOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-72 sm:w-80 shrink-0 flex flex-col rounded-2xl bg-slate-100/70 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800/60 max-h-[calc(100vh-14rem)]">
      {/* Column Header */}
      <div className="flex items-center justify-between px-3.5 py-3 border-b border-slate-200/40 dark:border-slate-800/40 shrink-0">
        <div className="flex items-center gap-2">
          <span
            className="w-2.5 h-2.5 rounded-full shrink-0"
            style={{ backgroundColor: column.color || '#6366f1' }}
          />
          <h3 className="font-semibold text-xs sm:text-sm text-slate-800 dark:text-slate-100 truncate">
            {column.name}
          </h3>
          <span className="text-[11px] font-bold text-slate-400 bg-white dark:bg-slate-800/80 px-2 py-0.5 rounded-full border border-slate-200/60 dark:border-slate-700/60 shadow-xs">
            {tasks.length}
          </span>
        </div>

        <button
          onClick={() => setIsQuickCreateOpen(!isQuickCreateOpen)}
          className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-white/80 dark:hover:bg-slate-800 transition-colors"
          title="Add task to column"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Quick Add Input */}
      {isQuickCreateOpen && (
        <form onSubmit={handleSubmit} className="p-2.5 border-b border-slate-200/40 dark:border-slate-800/40 bg-white/50 dark:bg-slate-900/50">
          <input
            type="text"
            autoFocus
            placeholder="Task title..."
            value={quickTitle}
            onChange={(e) => setQuickTitle(e.target.value)}
            className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
          <div className="flex items-center justify-end gap-1.5 mt-2">
            <button
              type="button"
              onClick={() => setIsQuickCreateOpen(false)}
              className="p-1 text-slate-400 hover:text-slate-600 rounded"
            >
              <X className="w-3.5 h-3.5" />
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !quickTitle.trim()}
              className="text-xs font-semibold px-2.5 py-1 rounded-md bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              Add
            </button>
          </div>
        </form>
      )}

      {/* Droppable Task List */}
      <Droppable droppableId={column.id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`flex-1 p-2 space-y-2 overflow-y-auto min-h-[140px] transition-colors rounded-b-2xl ${
              snapshot.isDraggingOver ? 'bg-indigo-50/40 dark:bg-indigo-950/20' : ''
            }`}
          >
            {tasks.map((task, index) => (
              <TaskCard
                key={task._id}
                task={task}
                index={index}
                projectKey={projectKey}
                onClick={() => onOpenTask(task._id)}
              />
            ))}
            {provided.placeholder}

            {tasks.length === 0 && !snapshot.isDraggingOver && (
              <div className="h-28 flex flex-col items-center justify-center text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800/80 rounded-xl m-1">
                <span>No tasks</span>
                <span className="text-[10px] text-slate-400/80 mt-0.5">Drag here or click +</span>
              </div>
            )}
          </div>
        )}
      </Droppable>
    </div>
  );
}
