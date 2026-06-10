import mongoose from 'mongoose';
import { IScheduledPostDocument } from '../../../types/types.js';
import ScheduledPost from '../model.js';

export const deleteManyPostsByUserId = async (userId: string): Promise<mongoose.mongo.DeleteResult> => {
  return await ScheduledPost.deleteMany({ user: new mongoose.Types.ObjectId(userId) });
};

export const deletePostByUserAndId = async (id: string, userId: string): Promise<IScheduledPostDocument | null> => {
  return await ScheduledPost.findOneAndDelete({
    _id: new mongoose.Types.ObjectId(id),
    user: new mongoose.Types.ObjectId(userId)
  });
};
