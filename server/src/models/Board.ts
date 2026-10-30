import mongoose, { Document, Schema } from 'mongoose';

export interface IBoardColumn {
  id: string;
  name: string;
  order: number;
  color?: string;
  taskLimit?: number;
}

export interface IBoard extends Document {
  projectId: mongoose.Types.ObjectId;
  workspaceId: mongoose.Types.ObjectId;
  name: string;
  isDefault: boolean;
  columns: IBoardColumn[];
  createdAt: Date;
  updatedAt: Date;
}

const BoardColumnSchema = new Schema<IBoardColumn>(
  {
    id: { type: String, required: true },
    name: { type: String, required: true, trim: true, maxlength: 50 },
    order: { type: Number, required: true },
    color: { type: String, default: '#6366f1' },
    taskLimit: { type: Number, default: 0 }, // 0 = unlimited
  },
  { _id: false }
);

const BoardSchema = new Schema<IBoard>(
  {
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    workspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 100 },
    isDefault: { type: Boolean, default: true },
    columns: {
      type: [BoardColumnSchema],
      default: [
        { id: 'backlog', name: 'Backlog', order: 0, color: '#94a3b8' },
        { id: 'todo', name: 'To Do', order: 1, color: '#3b82f6' },
        { id: 'in_progress', name: 'In Progress', order: 2, color: '#f59e0b' },
        { id: 'in_review', name: 'In Review', order: 3, color: '#8b5cf6' },
        { id: 'done', name: 'Done', order: 4, color: '#10b981' },
      ],
    },
  },
  {
    timestamps: true,
  }
);

export const Board = mongoose.model<IBoard>('Board', BoardSchema);
