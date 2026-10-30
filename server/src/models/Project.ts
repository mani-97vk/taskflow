import mongoose, { Document, Schema } from 'mongoose';
import { PROJECT_STATUS, TASK_PRIORITY, ProjectStatusType, TaskPriorityType, ROLES, RoleType } from '../config/constants.js';

export interface IProjectMember {
  userId: mongoose.Types.ObjectId;
  role: RoleType;
}

export interface IProject extends Document {
  workspaceId: mongoose.Types.ObjectId;
  name: string;
  key: string;
  description?: string;
  ownerId: mongoose.Types.ObjectId;
  status: ProjectStatusType;
  priority: TaskPriorityType;
  startDate?: Date;
  dueDate?: Date;
  tags: string[];
  visibility: 'workspace' | 'private';
  members: IProjectMember[];
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ProjectMemberSchema = new Schema<IProjectMember>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    role: { type: String, enum: Object.values(ROLES), default: ROLES.MEMBER },
  },
  { _id: false }
);

const ProjectSchema = new Schema<IProject>(
  {
    workspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 100 },
    key: { type: String, required: true, uppercase: true, trim: true, maxlength: 10 },
    description: { type: String, default: '', maxlength: 1000 },
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    status: {
      type: String,
      enum: Object.values(PROJECT_STATUS),
      default: PROJECT_STATUS.ACTIVE,
      index: true,
    },
    priority: {
      type: String,
      enum: Object.values(TASK_PRIORITY),
      default: TASK_PRIORITY.MEDIUM,
      index: true,
    },
    startDate: { type: Date },
    dueDate: { type: Date, index: true },
    tags: [{ type: String, trim: true }],
    visibility: { type: String, enum: ['workspace', 'private'], default: 'workspace' },
    members: [ProjectMemberSchema],
    isArchived: { type: Boolean, default: false, index: true },
  },
  {
    timestamps: true,
  }
);

// Enforce uniqueness of key per workspace
ProjectSchema.index({ workspaceId: 1, key: 1 }, { unique: true });

export const Project = mongoose.model<IProject>('Project', ProjectSchema);
