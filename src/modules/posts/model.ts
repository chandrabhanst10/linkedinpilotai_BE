import mongoose from 'mongoose';
import { IScheduledPostDocument, IMedia } from '../../types/types.js';

const mediaSchema = new mongoose.Schema<IMedia>({
  url: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ['image', 'video'],
    required: true,
  },
  publicId: {
    type: String,
    default: '',
  },
});

const scheduledPostSchema = new mongoose.Schema<IScheduledPostDocument>({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  linkedinAccounts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LinkedInAccount',
    required: true,
  }],
  content: {
    type: String,
    required: true,
    trim: true,
  },
  media: [mediaSchema],
  scheduledTime: {
    type: Date,
    required: true,
  },
  status: {
    type: String,
    enum: ['draft', 'scheduled', 'publishing', 'published', 'posted', 'failed'],
    default: 'scheduled',
  },
  platform: {
    type: String,
    enum: ['linkedin'],
    default: 'linkedin',
  },
  publishedAt: {
    type: Date,
    default: null,
  },
  error: {
    type: String,
    default: '',
  },
  screenshotUrl: {
    type: String,
    default: '',
  },
  linkedinPostUrn: {
    type: String,
    default: '',
  },
}, {
  timestamps: true,
});

scheduledPostSchema.index({ status: 1, scheduledTime: 1 });

const ScheduledPost = mongoose.model<IScheduledPostDocument>('ScheduledPost', scheduledPostSchema);
export default ScheduledPost;
