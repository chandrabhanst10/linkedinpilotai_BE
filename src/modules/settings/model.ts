import mongoose from 'mongoose';
import { IWorkspaceDocument, ISubscriptionDocument } from '../../types/types.js';

const workspaceSchema = new mongoose.Schema<IWorkspaceDocument>({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  members: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    role: {
      type: String,
      enum: ['owner', 'admin', 'member'],
      default: 'member',
    },
  }],
}, {
  timestamps: true,
});

workspaceSchema.index({ owner: 1 });

const Workspace = mongoose.model<IWorkspaceDocument>('Workspace', workspaceSchema);

const subscriptionSchema = new mongoose.Schema<ISubscriptionDocument>({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  plan: {
    type: String,
    enum: ['free', 'pro', 'agency'],
    default: 'free',
  },
  status: {
    type: String,
    enum: ['active', 'canceled', 'past_due', 'incomplete'],
    default: 'active',
  },
  expiresAt: {
    type: Date,
    required: true,
    default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  },
}, {
  timestamps: true,
});

subscriptionSchema.index({ user: 1 });

const Subscription = mongoose.model<ISubscriptionDocument>('Subscription', subscriptionSchema);

export { Workspace, Subscription };
