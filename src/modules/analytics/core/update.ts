import { IAnalyticsDocument } from '../../../types/types.js';
import Analytics from '../model.js';

export const updateAnalyticsRecord = async (
  id: string,
  data: Partial<IAnalyticsDocument>
): Promise<IAnalyticsDocument | null> => {
  return await Analytics.findByIdAndUpdate(id, data, { new: true });
};
