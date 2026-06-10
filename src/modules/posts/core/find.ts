import mongoose from 'mongoose';
import { IScheduledPostDocument } from '../../../types/types.js';
import ScheduledPost from '../model.js';

export const countAllPosts = async (): Promise<number> => {
  return await ScheduledPost.countDocuments();
};

export const countPostsByStatus = async (status: string): Promise<number> => {
  return await ScheduledPost.countDocuments({ status });
};

export const findFailedPostsForAdmin = async (): Promise<IScheduledPostDocument[]> => {
  return await ScheduledPost.find({ status: 'failed' })
    .populate('user', 'name email')
    .populate('linkedinAccounts', 'name avatar')
    .sort({ updatedAt: -1 });
};

export const findPosts = async (
  query: mongoose.FilterQuery<IScheduledPostDocument>,
  skip: number,
  limit: number,
  sort: Record<string, 1 | -1> = { scheduledTime: -1 }
): Promise<IScheduledPostDocument[]> => {
  return await ScheduledPost.find(query)
    .populate('linkedinAccounts', 'name avatar')
    .sort(sort as { [key: string]: mongoose.SortOrder })
    .skip(skip)
    .limit(limit);
};

export const countPosts = async (query: mongoose.FilterQuery<IScheduledPostDocument>): Promise<number> => {
  return await ScheduledPost.countDocuments(query);
};

export const findPostByIdAndUser = async (id: string, userId: string): Promise<IScheduledPostDocument | null> => {
  return await ScheduledPost.findOne({
    _id: new mongoose.Types.ObjectId(id),
    user: new mongoose.Types.ObjectId(userId)
  });
};

export const findPostByIdAndUserWithAccounts = async (id: string, userId: string): Promise<IScheduledPostDocument | null> => {
  return await ScheduledPost.findOne({
    _id: new mongoose.Types.ObjectId(id),
    user: new mongoose.Types.ObjectId(userId)
  }).populate('linkedinAccounts', 'name avatar');
};

export const findPostById = async (id: string): Promise<IScheduledPostDocument | null> => {
  return await ScheduledPost.findById(id);
};

export const findOverduePosts = async (now: Date): Promise<IScheduledPostDocument[]> => {
  return await ScheduledPost.find({
    status: { $in: ['scheduled', 'publishing'] },
    scheduledTime: { $lte: now }
  }).populate('linkedinAccounts');
};

export const getStatsForUser = async (userId: string): Promise<{ total: number; scheduled: number; published: number; failed: number }> => {
  const userObjectId = new mongoose.Types.ObjectId(userId);
  const [total, scheduled, published, failed] = await Promise.all([
    ScheduledPost.countDocuments({ user: userObjectId }),
    ScheduledPost.countDocuments({ user: userObjectId, status: 'scheduled' }),
    ScheduledPost.countDocuments({ user: userObjectId, status: { $in: ['published', 'posted'] } }),
    ScheduledPost.countDocuments({ user: userObjectId, status: 'failed' })
  ]);
  return { total, scheduled, published, failed };
};

export const getUpcomingPostsForUser = async (userId: string, limit: number): Promise<IScheduledPostDocument[]> => {
  return await ScheduledPost.find({
    user: new mongoose.Types.ObjectId(userId),
    status: 'scheduled'
  })
    .populate('linkedinAccounts', 'name avatar')
    .sort({ scheduledTime: 1 })
    .limit(limit);
};

export const getRecentActivitiesForUser = async (userId: string, limit: number): Promise<IScheduledPostDocument[]> => {
  return await ScheduledPost.find({
    user: new mongoose.Types.ObjectId(userId),
    status: { $in: ['published', 'posted', 'failed'] }
  })
    .populate('linkedinAccounts', 'name avatar')
    .sort({ updatedAt: -1 })
    .limit(limit);
};

export const getTopPerformingPostsForUser = async (userId: string, limit: number): Promise<IScheduledPostDocument[]> => {
  return await ScheduledPost.find({
    user: new mongoose.Types.ObjectId(userId),
    status: { $in: ['published', 'posted'] }
  })
    .populate('linkedinAccounts', 'name avatar')
    .sort({ updatedAt: -1 })
    .limit(limit);
};
