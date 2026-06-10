import mongoose from 'mongoose';
import { INotificationDocument } from '../../types/types.js';

const notificationSchema = new mongoose.Schema<INotificationDocument>({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ['success', 'error', 'info', 'warning'],
    default: 'info',
  },
  isRead: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

notificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });

const Notification = mongoose.model<INotificationDocument>('Notification', notificationSchema);
export default Notification;
