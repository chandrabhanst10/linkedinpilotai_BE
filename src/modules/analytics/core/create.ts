import { IAnalyticsDocument } from '../../../types/types.js';
import Analytics from '../model.js';

export const createAnalyticsRecord = async (data: Partial<IAnalyticsDocument>): Promise<IAnalyticsDocument> => {
  return await Analytics.create(data);
};
