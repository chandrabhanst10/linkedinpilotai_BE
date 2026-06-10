import mongoose from 'mongoose';
import { IAnalyticsDocument } from '../../../types/types.js';
import Analytics from '../model.js';

export const findAnalyticsByAccount = async (
  accountId: string,
  startDate: Date,
  endDate: Date
): Promise<IAnalyticsDocument[]> => {
  return await Analytics.find({
    linkedinAccount: new mongoose.Types.ObjectId(accountId),
    date: { $gte: startDate, $lte: endDate }
  }).sort({ date: 1 });
};
