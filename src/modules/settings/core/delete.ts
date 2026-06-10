import mongoose from 'mongoose';
import { Subscription } from '../model.js';

export const deleteManySubscriptionsByUserId = async (userId: string): Promise<mongoose.mongo.DeleteResult> => {
  return await Subscription.deleteMany({ user: new mongoose.Types.ObjectId(userId) });
};
