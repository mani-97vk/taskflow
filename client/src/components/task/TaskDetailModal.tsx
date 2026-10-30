import React, { useState, useEffect } from 'react';
import {
  X,
  Calendar,
  User,
  Clock,
  Tag,
  Paperclip,
  CheckSquare,
  MessageSquare,
  Trash2,
  Send,
  Upload,
  AlertCircle,
  FileText,
  Download,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tasksApi, commentsApi } from '../../api/index.js';
import { useAuth } from '../../context/AuthContext.js';
import { useWorkspace } from '../../context/WorkspaceContext.js';
import { useSocket } from '../../context/SocketContext.js';
import { Avatar } from '../ui/Avatar.js';
import { PriorityBadge, StatusBadge } from '../ui/Badge.js';
import { Button } from '../ui/Button.js';
import { ConfirmDialog } from '../ui/ConfirmDialog.js';
import { toast } from 'sonner';
import { Task, Comment } from '../../types/index.js';

interface TaskDetailModalProps {
  taskId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function TaskDetailModal({ taskId, isOpen, onClose }: TaskDetailModalProps) {
  const { user } = useAuth();
  const { members } = useWorkspace();
  const { socket } = useSocket();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'details' | 'comments' | 'attachments'>('details');
  const [newComment, setNewComment] = useState('');
  const [newChecklistTitle, setNewChecklistTitle] = useState('');
  const [newLabel, setNewLabel] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);

  // Fetch task details
  const {
    data: task,
    isLoading: isTaskLoading,
    error: taskError,
  } = useQuery({
    queryKey: ['task', taskId],
    queryFn: () => tasksApi.get(taskId),
    enabled: isOpen && !!taskId,
  });

  // Fetch comments
  const { data: comments = [] } = useQuery({
    queryKey: ['comments', taskId],
    queryFn: () => commentsApi.listByTask(taskId),
    enabled: isOpen && !!taskId,
  });

  // Socket listener for real-time task & comment events
  useEffect(() => {
    if (!socket || !isOpen) return;

    const handleTaskUpdated = (updatedTask: Task) => {
      if (updatedTask._id === taskId) {
        queryClient.setQueryData(['task', taskId], updatedTask);
        queryClient.invalidateQueries({ queryKey: ['tasks'] });
      }
    };

    const handleCommentCreated = (comment: Comment) => {
      if (comment.taskId === taskId) {
        queryClient.invalidateQueries({ queryKey: ['comments', taskId] });
      }
    };

    socket.on('task:updated', handleTaskUpdated);
    socket.on('comment:created', handleCommentCreated);

    return () => {
      socket.off('task:updated', handleTaskUpdated);
      socket.off('comment:created', handleCommentCreated);
    };
  }, [socket, taskId, isOpen, queryClient]);

  // Mutations
  const updateTaskMutation = useMutation({
    mutationFn: (updates: Partial<Task>) => tasksApi.update(taskId, updates),
    onSuccess: (updated) => {
      queryClient.setQueryData(['task', taskId], updated);
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Task updated');
    },
    onError: () => toast.error('Failed to update task'),
  });

  const postCommentMutation = useMutation({
    mutationFn: (content: string) => commentsApi.create(taskId, { content }),
    onSuccess: () => {
      setNewComment('');
      queryClient.invalidateQueries({ queryKey: ['comments', taskId] });
      toast.success('Comment posted');
    },
    onError: () => toast.error('Failed to post comment'),
  });

  const deleteCommentMutation = useMutation({
    mutationFn: (commentId: string) => commentsApi.delete(commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', taskId] });
      toast.success('Comment deleted');
    },
    onError: () => toast.error('Failed to delete comment'),
  });

  const addChecklistMutation = useMutation({
    mutationFn: (title: string) => tasksApi.addChecklistItem(taskId, title),
    onSuccess: () => {
      setNewChecklistTitle('');
      queryClient.invalidateQueries({ queryKey: ['task', taskId] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  const toggleChecklistMutation = useMutation({
    mutationFn: (itemId: string) => tasksApi.toggleChecklistItem(taskId, itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task', taskId] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  const deleteChecklistMutation = useMutation({
    mutationFn: (itemId: string) => tasksApi.deleteChecklistItem(taskId, itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task', taskId] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  const uploadAttachmentMutation = useMutation({
    mutationFn: (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      return tasksApi.uploadAttachment(taskId, formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task', taskId] });
      toast.success('File uploaded');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Upload failed');
    },
  });

  const deleteAttachmentMutation = useMutation({
    mutationFn: (attachmentId: string) => tasksApi.deleteAttachment(taskId, attachmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task', taskId] });
      toast.success('Attachment deleted');
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: () => tasksApi.delete(taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Task deleted');
      onClose();
    },
    onError: () => toast.error('Failed to delete task'),
  });

  if (!isOpen) return null;

  const totalChecklist = task?.checklist?.length || 0;
  const completedChecklist = task?.checklist?.filter((c) => c.completed).length || 0;
  const checklistPercent = totalChecklist > 0 ? Math.round((completedChecklist / totalChecklist) * 100) : 0;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={onClose} />

        <div className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 z-10 my-6 overflow-hidden flex flex-col max-h-[90vh]">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/80 px-2.5 py-1 rounded-md">
                {(task?.projectId as any)?.key || 'TASK'}-{task?.taskNumber}
              </span>
              <PriorityBadge priority={task?.priority || 'medium'} />
              <StatusBadge status={task?.columnId || 'todo'} />
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsConfirmDeleteOpen(true)}
                className="text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                icon={<Trash2 className="w-4 h-4" />}
              >
                Delete
              </Button>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Body */}
          {isTaskLoading ? (
            <div className="p-12 text-center text-sm text-slate-500">Loading task details...</div>
          ) : !task ? (
            <div className="p-12 text-center text-sm text-slate-500">Task not found</div>
          ) : (
            <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-100 dark:divide-slate-800">
              {/* Left / Main Section (2 Cols) */}
              <div className="md:col-span-2 p-6 space-y-6">
                {/* Title */}
                <input
                  type="text"
                  defaultValue={task.title}
                  onBlur={(e) => {
                    if (e.target.value.trim() && e.target.value !== task.title) {
                      updateTaskMutation.mutate({ title: e.target.value });
                    }
                  }}
                  className="w-full text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-indigo-500/20 rounded px-1.5 py-0.5"
                />

                {/* Navigation Tabs */}
                <div className="flex items-center gap-1 border-b border-slate-100 dark:border-slate-800 pb-2">
                  <button
                    onClick={() => setActiveTab('details')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                      activeTab === 'details'
                        ? 'bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400'
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    <CheckSquare className="w-3.5 h-3.5" />
                    <span>Checklist & Details</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('comments')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                      activeTab === 'comments'
                        ? 'bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400'
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Comments ({comments.length})</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('attachments')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                      activeTab === 'attachments'
                        ? 'bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400'
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    <Paperclip className="w-3.5 h-3.5" />
                    <span>Attachments ({task.attachments?.length || 0})</span>
                  </button>
                </div>

                {/* Details Tab */}
                {activeTab === 'details' && (
                  <div className="space-y-6">
                    {/* Description */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                        Description
                      </label>
                      <textarea
                        rows={4}
                        defaultValue={task.description || ''}
                        placeholder="Add a detailed description..."
                        onBlur={(e) => {
                          if (e.target.value !== (task.description || '')) {
                            updateTaskMutation.mutate({ description: e.target.value });
                          }
                        }}
                        className="w-full text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 p-3 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                      />
                    </div>

                    {/* Checklist */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                          Checklist ({completedChecklist}/{totalChecklist})
                        </label>
                        {totalChecklist > 0 && (
                          <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                            {checklistPercent}%
                          </span>
                        )}
                      </div>

                      {totalChecklist > 0 && (
                        <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden mb-3">
                          <div
                            className="h-full bg-indigo-600 transition-all duration-300 rounded-full"
                            style={{ width: `${checklistPercent}%` }}
                          />
                        </div>
                      )}

                      <div className="space-y-2">
                        {task.checklist?.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center justify-between gap-2 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors group"
                          >
                            <label className="flex items-center gap-3 cursor-pointer flex-1 min-w-0">
                              <input
                                type="checkbox"
                                checked={item.completed}
                                onChange={() => toggleChecklistMutation.mutate(item.id)}
                                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 dark:border-slate-700 dark:bg-slate-800"
                              />
                              <span
                                className={`text-xs sm:text-sm truncate ${
                                  item.completed
                                    ? 'line-through text-slate-400 dark:text-slate-500'
                                    : 'text-slate-800 dark:text-slate-200'
                                }`}
                              >
                                {item.title}
                              </span>
                            </label>

                            <button
                              onClick={() => deleteChecklistMutation.mutate(item.id)}
                              className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-600 transition-opacity"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}

                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            if (newChecklistTitle.trim()) {
                              addChecklistMutation.mutate(newChecklistTitle.trim());
                            }
                          }}
                          className="flex items-center gap-2 mt-2"
                        >
                          <input
                            type="text"
                            placeholder="Add an item..."
                            value={newChecklistTitle}
                            onChange={(e) => setNewChecklistTitle(e.target.value)}
                            className="flex-1 text-xs sm:text-sm px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                          />
                          <Button type="submit" size="sm" disabled={!newChecklistTitle.trim()}>
                            Add
                          </Button>
                        </form>
                      </div>
                    </div>
                  </div>
                )}

                {/* Comments Tab */}
                {activeTab === 'comments' && (
                  <div className="space-y-4">
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (newComment.trim()) {
                          postCommentMutation.mutate(newComment.trim());
                        }
                      }}
                      className="space-y-2"
                    >
                      <textarea
                        rows={3}
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Leave a comment or mention @teammate..."
                        className="w-full text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                      />
                      <div className="flex justify-end">
                        <Button
                          type="submit"
                          size="sm"
                          disabled={!newComment.trim()}
                          isLoading={postCommentMutation.isPending}
                          icon={<Send className="w-3.5 h-3.5" />}
                        >
                          Comment
                        </Button>
                      </div>
                    </form>

                    <div className="space-y-3 pt-2">
                      {comments.length === 0 ? (
                        <p className="text-xs text-center py-6 text-slate-400">
                          No comments yet. Start the discussion!
                        </p>
                      ) : (
                        comments.map((comment) => (
                          <div
                            key={comment._id}
                            className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 space-y-1.5"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Avatar user={comment.authorId} size="xs" />
                                <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                                  {comment.authorId?.name}
                                </span>
                                <span className="text-[10px] text-slate-400">
                                  {new Date(comment.createdAt).toLocaleDateString()} at{' '}
                                  {new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>

                              {(comment.authorId?._id === user?.id || comment.authorId?.id === user?.id) && (
                                <button
                                  onClick={() => deleteCommentMutation.mutate(comment._id)}
                                  className="text-slate-400 hover:text-rose-600 p-1 rounded"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                              {comment.content}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {/* Attachments Tab */}
                {activeTab === 'attachments' && (
                  <div className="space-y-4">
                    <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <Upload className="w-6 h-6 text-slate-400 mb-1" />
                      <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                        Click to upload an attachment
                      </span>
                      <span className="text-[10px] text-slate-400 mt-0.5">Images, PDFs, Docs up to 10MB</span>
                      <input
                        type="file"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            uploadAttachmentMutation.mutate(file);
                          }
                        }}
                      />
                    </label>

                    <div className="space-y-2">
                      {task.attachments?.map((att) => (
                        <div
                          key={att.id}
                          className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                        >
                          <div className="flex items-center gap-3 overflow-hidden">
                            <FileText className="w-5 h-5 text-indigo-500 shrink-0" />
                            <div className="overflow-hidden">
                              <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                                {att.originalName}
                              </p>
                              <p className="text-[10px] text-slate-400">
                                {(att.size / 1024).toFixed(1)} KB · Uploaded by {att.uploadedBy?.name || 'User'}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <a
                              href={`http://localhost:5000/${att.path}`}
                              target="_blank"
                              rel="noreferrer"
                              download
                              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                            >
                              <Download className="w-4 h-4" />
                            </a>
                            <button
                              onClick={() => deleteAttachmentMutation.mutate(att.id)}
                              className="p-1 text-slate-400 hover:text-rose-600"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Right Sidebar Meta (1 Col) */}
              <div className="p-6 space-y-5 bg-slate-50/50 dark:bg-slate-950/30">
                {/* Column / Status */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Status / Column
                  </label>
                  <select
                    value={task.columnId}
                    onChange={(e) => updateTaskMutation.mutate({ columnId: e.target.value })}
                    className="w-full text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  >
                    <option value="backlog">Backlog</option>
                    <option value="todo">To Do</option>
                    <option value="in_progress">In Progress</option>
                    <option value="in_review">In Review</option>
                    <option value="done">Done</option>
                  </select>
                </div>

                {/* Priority */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Priority
                  </label>
                  <select
                    value={task.priority}
                    onChange={(e) => updateTaskMutation.mutate({ priority: e.target.value as any })}
                    className="w-full text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                {/* Assignees */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Assignees
                  </label>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {task.assignees?.map((a) => (
                      <div
                        key={a._id || a.id}
                        className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200"
                      >
                        <Avatar user={a} size="xs" />
                        <span>{a.name}</span>
                        <button
                          type="button"
                          onClick={() => {
                            const newAssignees = task.assignees
                              .filter((user) => (user._id || user.id) !== (a._id || a.id))
                              .map((u) => u._id || u.id);
                            updateTaskMutation.mutate({ assignees: newAssignees as any });
                          }}
                          className="hover:text-rose-500"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <select
                    onChange={(e) => {
                      if (e.target.value) {
                        const currentIds = task.assignees?.map((u) => u._id || u.id) || [];
                        if (!currentIds.includes(e.target.value)) {
                          updateTaskMutation.mutate({ assignees: [...currentIds, e.target.value] as any });
                        }
                        e.target.value = '';
                      }
                    }}
                    className="w-full text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-slate-700 dark:text-slate-300 focus:outline-none"
                  >
                    <option value="">+ Assign team member...</option>
                    {members.map((m) => (
                      <option key={m._id} value={m.userId._id || m.userId.id}>
                        {m.userId.name} ({m.userId.email})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Due Date */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Due Date
                  </label>
                  <input
                    type="date"
                    defaultValue={task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : ''}
                    onChange={(e) =>
                      updateTaskMutation.mutate({
                        dueDate: e.target.value ? new Date(e.target.value).toISOString() : (undefined as any),
                      })
                    }
                    className="w-full text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-1.5 text-slate-800 dark:text-slate-200 focus:outline-none"
                  />
                </div>

                {/* Labels */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Labels
                  </label>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {task.labels?.map((l) => (
                      <span
                        key={l}
                        className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                      >
                        {l}
                        <button
                          type="button"
                          onClick={() => {
                            const newLabels = task.labels.filter((item) => item !== l);
                            updateTaskMutation.mutate({ labels: newLabels });
                          }}
                          className="hover:text-rose-500"
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
                      </span>
                    ))}
                  </div>

                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (newLabel.trim() && !task.labels?.includes(newLabel.trim())) {
                        updateTaskMutation.mutate({ labels: [...(task.labels || []), newLabel.trim()] });
                        setNewLabel('');
                      }
                    }}
                    className="flex gap-1"
                  >
                    <input
                      type="text"
                      placeholder="Add label..."
                      value={newLabel}
                      onChange={(e) => setNewLabel(e.target.value)}
                      className="w-full text-xs px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none"
                    />
                  </form>
                </div>

                {/* Creator & Metadata */}
                <div className="pt-3 border-t border-slate-200/80 dark:border-slate-800/80 space-y-2 text-[11px] text-slate-500 dark:text-slate-400">
                  <div className="flex items-center justify-between">
                    <span>Created By:</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                      {task.creatorId?.name || 'Unknown'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Created:</span>
                    <span>{new Date(task.createdAt).toLocaleDateString()}</span>
                  </div>
                  {task.completedAt && (
                    <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 font-medium">
                      <span>Completed:</span>
                      <span>{new Date(task.completedAt).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={isConfirmDeleteOpen}
        onClose={() => setIsConfirmDeleteOpen(false)}
        onConfirm={() => deleteTaskMutation.mutate()}
        title="Delete Task"
        message={`Are you sure you want to delete "${task?.title}"? All checklists and comments will be permanently removed.`}
        confirmLabel="Delete Task"
        isLoading={deleteTaskMutation.isPending}
      />
    </>
  );
}
