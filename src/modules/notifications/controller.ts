import { Request, Response, NextFunction } from 'express';
import * as notificationsService from './service.js';
import { getParam } from '../../utils/params.js';

export const getNotifications = async (req: Request, res: Response, next: NextFunction): Promise<void | Response> => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }
    const notifications = await notificationsService.getUserNotifications(String(req.user._id), 50);
    return res.status(200).json({ success: true, data: notifications });
  } catch (error: unknown) {
    next(error);
  }
};

export const markAsRead = async (req: Request, res: Response, next: NextFunction): Promise<void | Response> => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }
    const notification = await notificationsService.readNotification(getParam(req.params, 'id'), String(req.user._id));

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    return res.status(200).json({ success: true, data: notification });
  } catch (error: unknown) {
    next(error);
  }
};

export const markAllAsRead = async (req: Request, res: Response, next: NextFunction): Promise<void | Response> => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }
    await notificationsService.readAllUserNotifications(String(req.user._id));
    return res.status(200).json({ success: true, message: 'All notifications marked as read' });
  } catch (error: unknown) {
    next(error);
  }
};

export const deleteNotification = async (req: Request, res: Response, next: NextFunction): Promise<void | Response> => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }
    const notification = await notificationsService.removeNotification(getParam(req.params, 'id'), String(req.user._id));
    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }
    return res.status(200).json({ success: true, message: 'Notification deleted' });
  } catch (error: unknown) {
    next(error);
  }
};
