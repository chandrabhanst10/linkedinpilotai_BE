import { Request, Response, NextFunction } from 'express';
import * as settingsService from './service.js';

export const updateProfile = async (req: Request, res: Response, next: NextFunction): Promise<void | Response> => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }
    const { name, email } = req.body;
    const user = await settingsService.updateUserProfile(String(req.user._id), name, email);

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified
      }
    });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'Email already taken') {
      return res.status(400).json({ success: false, message: error.message });
    }
    next(error);
  }
};

export const updatePassword = async (req: Request, res: Response, next: NextFunction): Promise<void | Response> => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }
    const { currentPassword, newPassword } = req.body;
    await settingsService.updateUserPassword(String(req.user._id), currentPassword, newPassword);

    return res.status(200).json({ success: true, message: 'Password updated successfully' });
  } catch (error: unknown) {
    if (error instanceof Error && (error.message === 'Please provide current and new password' || error.message === 'Current password is incorrect')) {
      return res.status(400).json({ success: false, message: error.message });
    }
    next(error);
  }
};

export const getBillingDetails = async (req: Request, res: Response, next: NextFunction): Promise<void | Response> => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }
    const billing = await settingsService.getUserBilling(String(req.user._id));

    return res.status(200).json({
      success: true,
      data: billing
    });
  } catch (error: unknown) {
    next(error);
  }
};

export const updateBillingPlan = async (req: Request, res: Response, next: NextFunction): Promise<void | Response> => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }
    const { plan } = req.body;
    if (!['free', 'pro', 'agency'].includes(plan)) {
      return res.status(400).json({ success: false, message: 'Invalid plan type' });
    }

    const sub = await settingsService.changeBillingPlan(String(req.user._id), plan);

    return res.status(200).json({ success: true, message: `Plan updated to ${plan} successfully`, data: sub });
  } catch (error: unknown) {
    next(error);
  }
};
