import type { FilterQuery } from 'mongoose';
import * as postsCore from './core/index.js';
import * as queueManager from './queue.js';
import * as accountsCore from '../accounts/core/index.js';
import { HttpError } from '../../utils/httpError.js';
import { toObjectId } from '../../utils/objectId.js';
import { IScheduledPostDocument, IMedia } from '../../types/types.js';

const assertLinkedInAccountsOwned = async (userId: string, linkedinAccounts: string[]): Promise<void> => {
  for (const accountId of linkedinAccounts) {
    const account = await accountsCore.findLinkedInAccountByUserAndId(accountId, userId);
    if (!account) {
      throw new HttpError(400, 'One or more LinkedIn accounts are invalid or not connected to your profile');
    }
  }
};

export const schedulePost = async (
  userId: string,
  content: string,
  scheduledTime: string,
  linkedinAccounts: string[],
  media: IMedia[] = [],
  status?: string
): Promise<IScheduledPostDocument> => {
  await assertLinkedInAccountsOwned(userId, linkedinAccounts);

  const post = await postsCore.createPost({
    user: toObjectId(userId),
    linkedinAccounts: linkedinAccounts.map((id) => toObjectId(id)),
    content,
    media: media || [],
    scheduledTime: new Date(scheduledTime),
    status: (status || 'scheduled') as IScheduledPostDocument['status'],
    platform: 'linkedin',
  });

  if (post.status === 'scheduled') {
    await queueManager.addPostJob(post);
  }

  return post;
};

export const listPosts = async (
  userId: string,
  tab?: string,
  search?: string,
  limit = 10,
  page = 1
) => {
  const query: FilterQuery<IScheduledPostDocument> = {
    user: toObjectId(userId)
  };

  if (tab) {
    if (tab === 'published') {
      query.status = { $in: ['published', 'posted'] };
    } else {
      query.status = tab;
    }
  }

  if (search && typeof search === 'string') {
    const escapedSearch = search.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    query.content = { $regex: escapedSearch, $options: 'i' };
  }

  const skip = (page - 1) * limit;
  const sort: Record<string, 1 | -1> = { scheduledTime: tab === 'published' ? -1 : 1 };

  const posts = await postsCore.findPosts(query, skip, limit, sort);
  const total = await postsCore.countPosts(query);

  return {
    posts,
    total,
    page,
    limit,
    pages: Math.ceil(total / limit),
  };
};

export const getSinglePost = async (id: string, userId: string): Promise<IScheduledPostDocument | null> => {
  return await postsCore.findPostByIdAndUserWithAccounts(id, userId);
};

export const editPost = async (
  id: string,
  userId: string,
  updateData: {
    content?: string;
    media?: IMedia[];
    scheduledTime?: string;
    status?: string;
    linkedinAccounts?: string[];
  }
): Promise<IScheduledPostDocument | null> => {
  const post = await postsCore.findPostByIdAndUser(id, userId);
  if (!post) return null;

  const previousStatus = post.status;

  if (updateData.content !== undefined) post.content = updateData.content;
  if (updateData.media !== undefined) post.media = updateData.media;
  if (updateData.scheduledTime !== undefined) post.scheduledTime = new Date(updateData.scheduledTime);
  if (updateData.status !== undefined) post.status = updateData.status as IScheduledPostDocument['status'];
  if (updateData.linkedinAccounts !== undefined) {
    await assertLinkedInAccountsOwned(userId, updateData.linkedinAccounts);
    post.linkedinAccounts = updateData.linkedinAccounts.map((acctId) => toObjectId(acctId));
  }

  await post.save();

  if (post.status === 'scheduled') {
    await queueManager.addPostJob(post);
  } else if (previousStatus === 'scheduled') {
    await queueManager.removePostJob(String(post._id));
  }

  return post;
};

export const removePost = async (id: string, userId: string): Promise<IScheduledPostDocument | null> => {
  const post = await postsCore.deletePostByUserAndId(id, userId);
  if (!post) return null;

  if (post.status === 'scheduled') {
    await queueManager.removePostJob(String(post._id));
  }

  return post;
};

export const clonePost = async (id: string, userId: string): Promise<IScheduledPostDocument | null> => {
  const post = await postsCore.findPostByIdAndUser(id, userId);
  if (!post) return null;

  return await postsCore.createPost({
    user: toObjectId(userId),
    linkedinAccounts: post.linkedinAccounts,
    content: `${post.content} (Copy)`,
    media: post.media,
    scheduledTime: new Date(Date.now() + 60 * 60 * 1000), // Default to +1 hour
    status: 'draft',
  });
};

export const reprocessPost = async (id: string, userId: string): Promise<IScheduledPostDocument | null> => {
  const post = await postsCore.findPostByIdAndUser(id, userId);
  if (!post) return null;

  post.status = 'scheduled';
  post.error = '';
  post.scheduledTime = new Date(Date.now() + 10 * 1000); // 10 seconds from now
  await post.save();

  await queueManager.addPostJob(post);

  return post;
};
