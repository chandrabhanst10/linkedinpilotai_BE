import { IActivityLogDocument } from '../../../types/types.js';
import ActivityLog from '../model.js';

export const createActivityLog = async (data: Partial<IActivityLogDocument>): Promise<IActivityLogDocument> => {
  return await ActivityLog.create(data);
};
