import { IActivityLogDocument } from '../../../types/types.js';
import ActivityLog from '../model.js';

export const findActivityLogs = async (limit = 100): Promise<IActivityLogDocument[]> => {
  return await ActivityLog.find().sort({ createdAt: -1 }).limit(limit);
};
