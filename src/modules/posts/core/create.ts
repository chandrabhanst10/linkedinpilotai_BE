import { IScheduledPostDocument } from '../../../types/types.js';
import ScheduledPost from '../model.js';

export const createPost = async (data: Partial<IScheduledPostDocument>): Promise<IScheduledPostDocument> => {
  return await ScheduledPost.create(data);
};
