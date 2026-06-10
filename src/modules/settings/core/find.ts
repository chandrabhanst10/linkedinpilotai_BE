import mongoose from 'mongoose';
import { ISubscriptionDocument } from '../../../types/types.js';
import { Subscription } from '../model.js';

export const countSubscriptionsByPlan = async (plan: 'free' | 'pro' | 'agency'): Promise<number> => {
  return await Subscription.countDocuments({ plan });
};

export const findSubscriptionByUserId = async (userId: string): Promise<ISubscriptionDocument | null> => {
  return await Subscription.findOne({ user: new mongoose.Types.ObjectId(userId) });
};
