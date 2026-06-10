import mongoose, { Document } from 'mongoose';

// User types
export interface IUser {
  name: string;
  email: string;
  password?: string;
  googleId?: string | null;
  linkedinId?: string | null;
  role: 'user' | 'admin';
  isVerified: boolean;
  refreshToken?: string | null;
  resetPasswordCode?: string | null;
  resetPasswordExpires?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IUserDocument extends IUser, Document {
  comparePassword(candidatePassword: string): Promise<boolean>;
}

// Scheduled Post types
export interface IMedia {
  url: string;
  type: 'image' | 'video';
  publicId?: string;
}

export interface IScheduledPost {
  user: mongoose.Types.ObjectId;
  linkedinAccounts: mongoose.Types.ObjectId[];
  content: string;
  media: IMedia[];
  scheduledTime: Date;
  status: 'draft' | 'scheduled' | 'publishing' | 'published' | 'posted' | 'failed';
  platform: 'linkedin';
  publishedAt?: Date | null;
  error?: string;
  screenshotUrl?: string;
  linkedinPostUrn?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IScheduledPostDocument extends IScheduledPost, Document {}

// LinkedIn Account types
export interface ILinkedInAccount {
  user: mongoose.Types.ObjectId;
  linkedinId: string;
  name: string;
  avatar: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: Date | null;
  status: 'active' | 'expired' | 'disconnected';
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ILinkedInAccountDocument extends ILinkedInAccount, Document {}

// LinkedIn Connection types
export interface ILinkedInConnection {
  userId: mongoose.Types.ObjectId;
  linkedinId: string;
  name: string;
  email?: string;
  accessToken: string;
  expiresAt?: Date;
  connectedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ILinkedInConnectionDocument extends ILinkedInConnection, Document {}

// Notification types
export interface INotification {
  user: mongoose.Types.ObjectId;
  title: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  isRead: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface INotificationDocument extends INotification, Document {}

// Analytics types
export interface IAnalytics {
  linkedinAccount: mongoose.Types.ObjectId;
  date: Date;
  impressions: number;
  likes: number;
  comments: number;
  shares: number;
  clicks: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IAnalyticsDocument extends IAnalytics, Document {}

// Workspace types
export interface IWorkspaceMember {
  user: mongoose.Types.ObjectId;
  role: 'owner' | 'admin' | 'member';
}

export interface IWorkspace {
  name: string;
  owner: mongoose.Types.ObjectId;
  members: IWorkspaceMember[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IWorkspaceDocument extends IWorkspace, Document {}

// Subscription types
export interface ISubscription {
  user: mongoose.Types.ObjectId;
  plan: 'free' | 'pro' | 'agency';
  status: 'active' | 'canceled' | 'past_due' | 'incomplete';
  expiresAt: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ISubscriptionDocument extends ISubscription, Document {}

// Activity Log types
export interface IActivityLog {
  user: mongoose.Types.ObjectId;
  action: string;
  details?: string;
  ipAddress?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IActivityLogDocument extends IActivityLog, Document {}
