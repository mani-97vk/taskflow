import mongoose, { Document, Schema } from 'mongoose';
import { ROLES, RoleType } from '../config/constants.js';

export interface IInvitation extends Document {
  workspaceId: mongoose.Types.ObjectId;
  email: string;
  role: RoleType;
  token: string;
  invitedBy: mongoose.Types.ObjectId;
  status: 'pending' | 'accepted' | 'expired';
  expiresAt: Date;
  acceptedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const InvitationSchema = new Schema<IInvitation>(
  {
    workspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true, index: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    role: { type: String, enum: Object.values(ROLES), default: ROLES.MEMBER },
    token: { type: String, required: true, unique: true, index: true },
    invitedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['pending', 'accepted', 'expired'], default: 'pending', index: true },
    expiresAt: { type: Date, required: true },
    acceptedAt: { type: Date },
  },
  {
    timestamps: true,
  }
);

InvitationSchema.index({ workspaceId: 1, email: 1 });

export const Invitation = mongoose.model<IInvitation>('Invitation', InvitationSchema);
