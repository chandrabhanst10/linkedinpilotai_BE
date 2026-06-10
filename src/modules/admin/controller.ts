import { Request, Response, NextFunction } from 'express';
import * as adminService from './service.js';
import { getParam } from '../../utils/params.js';

export const getSystemStats = async (req: Request, res: Response, next: NextFunction): Promise<void | Response> => {
  try {
    const stats = await adminService.getStats();
    return res.status(200).json({ success: true, data: stats });
  } catch (error: unknown) {
    next(error);
  }
};

export const getUsersList = async (req: Request, res: Response, next: NextFunction): Promise<void | Response> => {
  try {
    const users = await adminService.fetchAllUsers();
    return res.status(200).json({ success: true, data: users });
  } catch (error: unknown) {
    next(error);
  }
};

export const deleteUser = async (req: Request, res: Response, next: NextFunction): Promise<void | Response> => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }
    const id = getParam(req.params, 'id');
    if (id === String(req.user._id)) {
      return res.status(400).json({ success: false, message: 'You cannot delete yourself' });
    }

    const user = await adminService.removeUserAndData(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    return res.status(200).json({ success: true, message: 'User and all associated data deleted successfully' });
  } catch (error: unknown) {
    next(error);
  }
};

export const updateRole = async (req: Request, res: Response, next: NextFunction): Promise<void | Response> => {
  try {
    const id = getParam(req.params, 'id');
    const { role } = req.body;

    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role' });
    }

    const user = await adminService.updateUserRole(id, role);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    return res.status(200).json({ success: true, message: 'User role updated successfully', data: user });
  } catch (error: unknown) {
    next(error);
  }
};

export const getFailedJobs = async (req: Request, res: Response, next: NextFunction): Promise<void | Response> => {
  try {
    const failedPosts = await adminService.fetchFailedPosts();
    return res.status(200).json({ success: true, data: failedPosts });
  } catch (error: unknown) {
    next(error);
  }
};
