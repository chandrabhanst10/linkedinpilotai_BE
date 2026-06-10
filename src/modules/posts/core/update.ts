import { IScheduledPostDocument } from '../../../types/types.js';
import ScheduledPost from '../model.js';

export const updatePost = async (
  id: string,
  data: Partial<IScheduledPostDocument>
): Promise<IScheduledPostDocument | null> => {
  return await ScheduledPost.findByIdAndUpdate(id, data, { new: true });
};
