import mongoose, { Document, Schema } from 'mongoose';
import { TASK_PRIORITY, TaskPriorityType } from '../config/constants.js';

export interface IChecklistItem {
  id: string;
  title: string;
  completed: boolean;
  completedAt?: Date;
}

export interface IAttachment {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  path: string;
  uploadedBy: mongoose.Types.ObjectId;
  uploadedAt: Date;
}

export interface ITask extends Document {
  workspaceId: mongoose.Types.ObjectId;
  projectId: mongoose.Types.ObjectId;
  boardId: mongoose.Types.ObjectId;
  columnId: string;
  taskNumber: number;
  title: string;
  description?: string;
  assignees: mongoose.Types.ObjectId[];
  creatorId: mongoose.Types.ObjectId;
  priority: TaskPriorityType;
  status: string;
  startDate?: Date;
  dueDate?: Date;
  labels: string[];
  estimatedEffort?: number;
  actualEffort?: number;
  position: number;
  parentTaskId?: mongoose.Types.ObjectId;
  checklist: IChecklistItem[];
  attachments: IAttachment[];
  completedAt?: Date;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ChecklistItemSchema = new Schema<IChecklistItem>(
  {
    id: { type: String, required: true },
    title: { type: String, required: true, trim: true },
    completed: { type: Boolean, default: false },
    completedAt: { type: Date },
  },
  { _id: false }
);

const AttachmentSchema = new Schema<IAttachment>(
  {
    id: { type: String, required: true },
    filename: { type: String, required: true },
    originalName: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
    path: { type: String, required: true },
    uploadedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const TaskSchema = new Schema<ITask>(
  {
    workspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true, index: true },
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    boardId: { type: Schema.Types.ObjectId, ref: 'Board', required: true, index: true },
    columnId: { type: String, required: true, index: true },
    taskNumber: { type: Number, required: true },
    title: { type: String, required: true, trim: true, maxlength: 250 },
    description: { type: String, default: '', maxlength: 5000 },
    assignees: [{ type: Schema.Types.ObjectId, ref: 'User', index: true }],
    creatorId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    priority: {
      type: String,
      enum: Object.values(TASK_PRIORITY),
      default: TASK_PRIORITY.MEDIUM,
      index: true,
    },
    status: { type: String, default: 'todo', index: true },
    startDate: { type: Date },
    dueDate: { type: Date, index: true },
    labels: [{ type: String, trim: true }],
    estimatedEffort: { type: Number, default: 0 },
    actualEffort: { type: Number, default: 0 },
    position: { type: Number, default: 0, index: true },
    parentTaskId: { type: Schema.Types.ObjectId, ref: 'Task', default: null, index: true },
    checklist: [ChecklistItemSchema],
    attachments: [AttachmentSchema],
    completedAt: { type: Date },
    isArchived: { type: Boolean, default: false, index: true },
  },
  {
    timestamps: true,
  }
);

TaskSchema.index({ projectId: 1, position: 1 });
TaskSchema.index({ projectId: 1, columnId: 1, position: 1 });
TaskSchema.index({ workspaceId: 1, assignees: 1 });
TaskSchema.index({ workspaceId: 1, dueDate: 1 });

export const Task = mongoose.model<ITask>('Task', TaskSchema);
