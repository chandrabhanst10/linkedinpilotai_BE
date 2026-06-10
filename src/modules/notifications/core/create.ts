import { INotificationDocument } from '../../../types/types.js';
import Notification from '../model.js';

export const createNotification = async (
  data: Partial<INotificationDocument>
): Promise<INotificationDocument> => {
  return await Notification.create(data);
};
