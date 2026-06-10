import mongoose from 'mongoose';
import Analytics from '../model.js';

export const deleteAnalyticsByAccount = async (accountId: string): Promise<void> => {
  await Analytics.deleteMany({ linkedinAccount: new mongoose.Types.ObjectId(accountId) });
};
