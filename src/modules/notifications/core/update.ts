import mongoose from 'mongoose';
import { INotificationDocument } from '../../../types/types.js';
import Notification from '../model.js';

export const markNotificationAsRead = async (
  id: string,
  userId: string
): Promise<INotificationDocument | null> => {
  return await Notification.findOneAndUpdate(
    { _id: new mongoose.Types.ObjectId(id), user: new mongoose.Types.ObjectId(userId) },
    { isRead: true },
    { new: true }
  );
};

export const markAllNotificationsAsRead = async (userId: string): Promise<mongoose.mongo.UpdateResult> => {
  return await Notification.updateMany(
    { user: new mongoose.Types.ObjectId(userId), isRead: false },
    { isRead: true }
  );
};
