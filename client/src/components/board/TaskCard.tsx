import React from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { Calendar, CheckSquare, MessageSquare, Paperclip, AlertTriangle } from 'lucide-react';
import { PriorityBadge } from '../ui/Badge.js';
import { AvatarGroup } from '../ui/Avatar.js';
import { Task } from '../../types/index.js';

interface TaskCardProps {
  task: Task;
  index: number;
  projectKey: string;
  onClick: () => void;
}

export function TaskCard({ task, index, projectKey, onClick }: TaskCardProps) {
  const isOverdue =
    task.dueDate &&
    new Date(task.dueDate) < new Date() &&
    task.columnId !== 'done' &&
    task.status !== 'done';

  const totalChecklist = task.checklist?.length || 0;
  const completedChecklist = task.checklist?.filter((c) => c.completed).length || 0;

  return (
    <Draggable draggableId={task._id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={onClick}
          className={`group relative p-3.5 rounded-xl border transition-all duration-150 select-none cursor-pointer ${
            snapshot.isDragging
              ? 'bg-white dark:bg-slate-800 shadow-2xl border-indigo-500 scale-[1.02] ring-2 ring-indigo-500/20'
              : 'bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-sm hover:shadow'
          }`}
        >
          {/* Top row: Key and Priority */}
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
              {projectKey}-{task.taskNumber}
            </span>
            <PriorityBadge priority={task.priority} size="sm" />
          </div>

          {/* Title */}
          <h4 className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-100 line-clamp-2 leading-snug">
            {task.title}
          </h4>

          {/* Labels */}
          {task.labels && task.labels.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {task.labels.slice(0, 3).map((label) => (
                <span
                  key={label}
                  className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                >
                  {label}
                </span>
              ))}
              {task.labels.length > 3 && (
                <span className="text-[10px] text-slate-400">+{task.labels.length - 3}</span>
              )}
            </div>
          )}

          {/* Bottom Row: Meta & Assignees */}
          <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 text-slate-400">
              {/* Due Date */}
              {task.dueDate && (
                <span
                  className={`inline-flex items-center gap-1 text-[11px] font-medium ${
                    isOverdue
                      ? 'text-rose-600 dark:text-rose-400 font-semibold'
                      : 'text-slate-500 dark:text-slate-400'
                  }`}
                  title={isOverdue ? 'Overdue!' : 'Due Date'}
                >
                  {isOverdue ? <AlertTriangle className="w-3 h-3 text-rose-500" /> : <Calendar className="w-3 h-3" />}
                  <span>{new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                </span>
              )}

              {/* Checklist */}
              {totalChecklist > 0 && (
                <span
                  className={`inline-flex items-center gap-1 text-[11px] ${
                    completedChecklist === totalChecklist ? 'text-emerald-600 font-medium' : 'text-slate-400'
                  }`}
                  title="Checklist completion"
                >
                  <CheckSquare className="w-3 h-3" />
                  <span>
                    {completedChecklist}/{totalChecklist}
                  </span>
                </span>
              )}

              {/* Attachments */}
              {task.attachments && task.attachments.length > 0 && (
                <span className="inline-flex items-center gap-0.5 text-[11px]" title="Attachments">
                  <Paperclip className="w-3 h-3" />
                  <span>{task.attachments.length}</span>
                </span>
              )}
            </div>

            {/* Assignees */}
            {task.assignees && task.assignees.length > 0 && (
              <AvatarGroup users={task.assignees} max={2} size="xs" />
            )}
          </div>
        </div>
      )}
    </Draggable>
  );
}
