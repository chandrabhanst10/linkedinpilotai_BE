import mongoose from 'mongoose';
import { IActivityLogDocument } from '../../types/types.js';

const activityLogSchema = new mongoose.Schema<IActivityLogDocument>({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  action: {
    type: String,
    required: true,
  },
  details: {
    type: String,
    default: '',
  },
  ipAddress: {
    type: String,
    default: '',
  },
}, {
  timestamps: true,
});

const ActivityLog = mongoose.model<IActivityLogDocument>('ActivityLog', activityLogSchema);
export default ActivityLog;
