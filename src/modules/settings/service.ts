import { toObjectId } from '../../utils/objectId.js';
import * as settingsCore from './core/index.js';
import * as authCore from '../auth/core/index.js';
import { IUserDocument, ISubscriptionDocument } from '../../types/types.js';

export const updateUserProfile = async (
  userId: string,
  name?: string,
  email?: string
): Promise<IUserDocument> => {
  const user = await authCore.findUserById(userId);
  if (!user) {
    throw new Error('User not found');
  }

  if (email && email !== user.email) {
    const emailExists = await authCore.findUserByEmail(email);
    if (emailExists) {
      throw new Error('Email already taken');
    }
    user.email = email;
  }

  if (name) user.name = name;
  await user.save();
  return user;
};

export const updateUserPassword = async (
  userId: string,
  currentPassword?: string,
  newPassword?: string
): Promise<void> => {
  if (!currentPassword || !newPassword) {
    throw new Error('Please provide current and new password');
  }

  const user = await authCore.findUserByIdWithPassword(userId);
  if (!user) {
    throw new Error('User not found');
  }

  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) {
    throw new Error('Current password is incorrect');
  }

  user.password = newPassword;
  await user.save();
};

export const getUserBilling = async (userId: string) => {
  const sub = await settingsCore.findSubscriptionByUserId(userId) || {
    plan: 'free',
    status: 'active',
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  };

  return {
    plan: sub.plan,
    status: sub.status,
    expiresAt: sub.expiresAt,
    limits: {
      postsPerMonth: sub.plan === 'free' ? 30 : sub.plan === 'pro' ? 500 : 10000,
      accountsLimit: sub.plan === 'free' ? 2 : sub.plan === 'pro' ? 10 : 100
    }
  };
};

export const changeBillingPlan = async (userId: string, plan: 'free' | 'pro' | 'agency'): Promise<ISubscriptionDocument> => {
  let sub = await settingsCore.findSubscriptionByUserId(userId);
  if (!sub) {
    sub = await settingsCore.createSubscription({
      user: toObjectId(userId),
      plan,
      status: 'active',
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
    });
  } else {
    sub.plan = plan;
    sub.status = 'active';
    sub.expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
    await sub.save();
  }

  return sub;
};
