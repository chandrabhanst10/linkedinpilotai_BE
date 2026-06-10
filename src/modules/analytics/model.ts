import mongoose from 'mongoose';
import { IAnalyticsDocument } from '../../types/types.js';

const analyticsSchema = new mongoose.Schema<IAnalyticsDocument>({
  linkedinAccount: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LinkedInAccount',
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  impressions: {
    type: Number,
    default: 0,
  },
  likes: {
    type: Number,
    default: 0,
  },
  comments: {
    type: Number,
    default: 0,
  },
  shares: {
    type: Number,
    default: 0,
  },
  clicks: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: true,
});

analyticsSchema.index({ linkedinAccount: 1, date: 1 }, { unique: true });

const Analytics = mongoose.model<IAnalyticsDocument>('Analytics', analyticsSchema);
export default Analytics;
