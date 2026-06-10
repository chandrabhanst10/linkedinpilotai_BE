import * as notificationsCore from './core/index.js';
import { INotificationDocument } from '../../types/types.js';

export const getUserNotifications = async (userId: string, limit = 50): Promise<INotificationDocument[]> => {
  return await notificationsCore.findNotificationsByUserId(userId, limit);
};

export const readNotification = async (id: string, userId: string): Promise<INotificationDocument | null> => {
  return await notificationsCore.markNotificationAsRead(id, userId);
};

export const readAllUserNotifications = async (userId: string) => {
  return await notificationsCore.markAllNotificationsAsRead(userId);
};

export const removeNotification = async (id: string, userId: string): Promise<INotificationDocument | null> => {
  return await notificationsCore.deleteNotificationByUserAndId(id, userId);
};
