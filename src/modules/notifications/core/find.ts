import mongoose from 'mongoose';
import { INotificationDocument } from '../../../types/types.js';
import Notification from '../model.js';

export const findNotificationsByUserId = async (userId: string, limit = 50): Promise<INotificationDocument[]> => {
  return await Notification.find({ user: new mongoose.Types.ObjectId(userId) })
    .sort({ createdAt: -1 })
    .limit(limit);
};
