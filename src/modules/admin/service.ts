import os from 'os';
import * as authCore from '../auth/core/index.js';
import * as postsCore from '../posts/core/index.js';
import * as settingsCore from '../settings/core/index.js';
import { IUserDocument, IScheduledPostDocument } from '../../types/types.js';

export const getStats = async () => {
  const totalUsers = await authCore.countAllUsers();
  const totalPosts = await postsCore.countAllPosts();
  const totalActiveSched = await postsCore.countPostsByStatus('scheduled');
  const totalFailed = await postsCore.countPostsByStatus('failed');

  const freeMem = os.freemem();
  const totalMem = os.totalmem();
  const ramUsage = Math.round(((totalMem - freeMem) / totalMem) * 100);

  const systemHealth = {
    cpuUsage: Math.round(os.loadavg()[0] * 10) || 5,
    memoryUsage: ramUsage,
    uptime: Math.round(os.uptime()),
    platform: os.platform(),
    arch: os.arch(),
  };

  const freePlans = await settingsCore.countSubscriptionsByPlan('free');
  const proPlans = await settingsCore.countSubscriptionsByPlan('pro');
  const agencyPlans = await settingsCore.countSubscriptionsByPlan('agency');

  return {
    counters: {
      totalUsers,
      totalPosts,
      totalActiveSched,
      totalFailed,
    },
    subscriptions: {
      free: freePlans,
      pro: proPlans,
      agency: agencyPlans,
    },
    systemHealth,
  };
};

export const fetchAllUsers = async (): Promise<IUserDocument[]> => {
  return await authCore.findAllUsersSortedByCreated();
};

export const removeUserAndData = async (userId: string): Promise<IUserDocument | null> => {
  const user = await authCore.deleteUserById(userId);
  if (!user) return null;

  await postsCore.deleteManyPostsByUserId(userId);
  await settingsCore.deleteManySubscriptionsByUserId(userId);

  return user;
};

export const updateUserRole = async (userId: string, role: 'user' | 'admin'): Promise<IUserDocument | null> => {
  const user = await authCore.findUserById(userId);
  if (!user) return null;

  user.role = role;
  await user.save();
  return user;
};

export const fetchFailedPosts = async (): Promise<IScheduledPostDocument[]> => {
  return await postsCore.findFailedPostsForAdmin();
};
