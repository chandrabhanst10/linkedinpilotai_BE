import mongoose from 'mongoose';
import { INotificationDocument } from '../../../types/types.js';
import Notification from '../model.js';

export const deleteNotificationByUserAndId = async (
  id: string,
  userId: string
): Promise<INotificationDocument | null> => {
  return await Notification.findOneAndDelete({
    _id: new mongoose.Types.ObjectId(id),
    user: new mongoose.Types.ObjectId(userId)
  });
};
