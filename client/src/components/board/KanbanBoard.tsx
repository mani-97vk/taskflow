import React, { useState, useEffect } from 'react';
import { DragDropContext, DropResult } from '@hello-pangea/dnd';
import { BoardColumn } from './BoardColumn.js';
import { BoardFilterBar, BoardFiltersState } from './BoardFilterBar.js';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tasksApi } from '../../api/index.js';
import { useSocket } from '../../context/SocketContext.js';
import { Board, Task } from '../../types/index.js';
import { toast } from 'sonner';

interface KanbanBoardProps {
  board: Board;
  projectId: string;
  projectKey: string;
  onOpenTask: (taskId: string) => void;
}

export function KanbanBoard({ board, projectId, projectKey, onOpenTask }: KanbanBoardProps) {
  const queryClient = useQueryClient();
  const { socket, joinProject, leaveProject } = useSocket();

  const [filters, setFilters] = useState<BoardFiltersState>({
    search: '',
    assignee: '',
    priority: '',
    dueFilter: '',
  });

  // Join project room for real-time collaboration
  useEffect(() => {
    joinProject(projectId);
    return () => {
      leaveProject(projectId);
    };
  }, [projectId]);

  // Fetch project tasks
  const { data: rawTasks = [], isLoading } = useQuery({
    queryKey: ['tasks', projectId],
    queryFn: () => tasksApi.listByProject(projectId),
  });

  // Real-time socket events for board tasks
  useEffect(() => {
    if (!socket) return;

    const handleTaskMoved = (data: { taskId: string; columnId: string; position: number }) => {
      queryClient.setQueryData(['tasks', projectId], (old: Task[] | undefined) => {
        if (!old) return old;
        return old.map((t) =>
          t._id === data.taskId ? { ...t, columnId: data.columnId, position: data.position } : t
        );
      });
    };

    const handleTaskCreated = (newTask: Task) => {
      queryClient.setQueryData(['tasks', projectId], (old: Task[] | undefined) => {
        if (!old) return [newTask];
        if (old.some((t) => t._id === newTask._id)) return old;
        return [...old, newTask];
      });
    };

    const handleTaskDeleted = (data: { taskId: string }) => {
      queryClient.setQueryData(['tasks', projectId], (old: Task[] | undefined) => {
        if (!old) return old;
        return old.filter((t) => t._id !== data.taskId);
      });
    };

    socket.on('task:moved', handleTaskMoved);
    socket.on('task:created', handleTaskCreated);
    socket.on('task:deleted', handleTaskDeleted);

    return () => {
      socket.off('task:moved', handleTaskMoved);
      socket.off('task:created', handleTaskCreated);
      socket.off('task:deleted', handleTaskDeleted);
    };
  }, [socket, projectId, queryClient]);

  // Apply filters
  const filteredTasks = rawTasks.filter((task) => {
    if (filters.search) {
      const q = filters.search.toLowerCase();
      const matchTitle = task.title.toLowerCase().includes(q);
      const matchDesc = task.description?.toLowerCase().includes(q);
      if (!matchTitle && !matchDesc) return false;
    }

    if (filters.assignee) {
      const isAssigned = task.assignees?.some(
        (a) => (a._id || a.id) === filters.assignee
      );
      if (!isAssigned) return false;
    }

    if (filters.priority && task.priority !== filters.priority) {
      return false;
    }

    if (filters.dueFilter) {
      const now = new Date();
      if (!task.dueDate) return false;
      const due = new Date(task.dueDate);

      if (filters.dueFilter === 'today') {
        const isSameDay =
          due.getFullYear() === now.getFullYear() &&
          due.getMonth() === now.getMonth() &&
          due.getDate() === now.getDate();
        if (!isSameDay) return false;
      } else if (filters.dueFilter === 'overdue') {
        if (due >= now || task.columnId === 'done') return false;
      }
    }

    return true;
  });

  // Drag and drop mutation
  const moveTaskMutation = useMutation({
    mutationFn: ({ taskId, columnId, position }: { taskId: string; columnId: string; position: number }) =>
      tasksApi.move(taskId, { columnId, position }),
    onError: (_err, _vars, context: any) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(['tasks', projectId], context.previousTasks);
      }
      toast.error('Failed to move task. Reverting position.');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
    },
  });

  const handleDragEnd = async (result: DropResult) => {
    const { source, destination, draggableId } = result;

    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) {
      return;
    }

    const previousTasks = queryClient.getQueryData<Task[]>(['tasks', projectId]) || [];

    // Calculate new position
    const targetColumnTasks = rawTasks
      .filter((t) => t.columnId === destination.droppableId && t._id !== draggableId)
      .sort((a, b) => a.position - b.position);

    let newPosition = 1000;
    if (targetColumnTasks.length === 0) {
      newPosition = 1000;
    } else if (destination.index === 0) {
      newPosition = Math.max(1, targetColumnTasks[0].position / 2);
    } else if (destination.index >= targetColumnTasks.length) {
      newPosition = targetColumnTasks[targetColumnTasks.length - 1].position + 1000;
    } else {
      const prev = targetColumnTasks[destination.index - 1].position;
      const next = targetColumnTasks[destination.index].position;
      newPosition = (prev + next) / 2;
    }

    // Optimistically update UI
    const updatedTasks = rawTasks.map((t) =>
      t._id === draggableId
        ? {
            ...t,
            columnId: destination.droppableId,
            position: newPosition,
            completedAt: destination.droppableId === 'done' ? new Date().toISOString() : undefined,
          }
        : t
    );

    queryClient.setQueryData(['tasks', projectId], updatedTasks);

    // Call server
    moveTaskMutation.mutate({
      taskId: draggableId,
      columnId: destination.droppableId,
      position: newPosition,
    });
  };

  const handleQuickCreate = async (columnId: string, title: string) => {
    try {
      await tasksApi.create(projectId, {
        columnId,
        title,
        priority: 'medium',
      });
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
      toast.success('Task added');
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to create task');
    }
  };

  const columns = board.columns || [
    { id: 'backlog', name: 'Backlog', order: 0, color: '#94a3b8' },
    { id: 'todo', name: 'To Do', order: 1, color: '#3b82f6' },
    { id: 'in_progress', name: 'In Progress', order: 2, color: '#f59e0b' },
    { id: 'in_review', name: 'In Review', order: 3, color: '#8b5cf6' },
    { id: 'done', name: 'Done', order: 4, color: '#10b981' },
  ];

  return (
    <div className="space-y-4">
      {/* Filters Bar */}
      <BoardFilterBar
        filters={filters}
        onFilterChange={setFilters}
        onReset={() =>
          setFilters({ search: '', assignee: '', priority: '', dueFilter: '' })
        }
      />

      {/* Kanban Columns */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-6 pt-1 select-none">
          {columns.map((column) => {
            const columnTasks = filteredTasks
              .filter((t) => t.columnId === column.id)
              .sort((a, b) => a.position - b.position);

            return (
              <BoardColumn
                key={column.id}
                column={column}
                tasks={columnTasks}
                projectKey={projectKey}
                onOpenTask={onOpenTask}
                onQuickCreateTask={handleQuickCreate}
              />
            );
          })}
        </div>
      </DragDropContext>
    </div>
  );
}
