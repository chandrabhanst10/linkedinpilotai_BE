import dayjs from 'dayjs';
import mongoose from 'mongoose';
import * as postsCore from '../posts/core/index.js';
import { IChartDataPoint, IPostingTimeData } from './types.js';

const PUBLISHED_STATUSES = ['published', 'posted'] as const;

export const getSummary = async (userId: string) => {
  const stats = await postsCore.getStatsForUser(userId);
  const upcoming = await postsCore.getUpcomingPostsForUser(userId, 5);
  const activities = await postsCore.getRecentActivitiesForUser(userId, 5);

  return {
    stats,
    upcoming,
    activities,
    source: 'database' as const,
  };
};

const getPublishedPostsInRange = async (userId: string, daysCount: number) => {
  const startDate = dayjs().subtract(daysCount, 'day').startOf('day').toDate();
  return postsCore.findPosts(
    {
      user: new mongoose.Types.ObjectId(userId),
      status: { $in: [...PUBLISHED_STATUSES] },
      $or: [
        { publishedAt: { $gte: startDate } },
        { updatedAt: { $gte: startDate }, publishedAt: null },
      ],
    },
    0,
    500,
    { publishedAt: -1, updatedAt: -1 }
  );
};

export const getCharts = async (userId: string, range = '7d'): Promise<IChartDataPoint[]> => {
  const daysCount = range === '90d' ? 90 : range === '30d' ? 30 : 7;
  const posts = await getPublishedPostsInRange(userId, daysCount);
  const chartData: IChartDataPoint[] = [];
  const baseDate = dayjs().subtract(daysCount, 'day').startOf('day');

  for (let i = 1; i <= daysCount; i++) {
    const currentDate = baseDate.add(i, 'day');
    const dayStart = currentDate.startOf('day');
    const dayEnd = currentDate.endOf('day');

    const dayPosts = posts.filter((post) => {
      const publishedAt = post.publishedAt || post.updatedAt;
      if (!publishedAt) return false;
      const ts = dayjs(publishedAt);
      return ts.isAfter(dayStart) && ts.isBefore(dayEnd);
    });

    const postCount = dayPosts.length;
    chartData.push({
      date: currentDate.format('MMM DD'),
      impressions: postCount * 100,
      likes: postCount * 7,
      comments: postCount * 2,
      shares: postCount,
      clicks: postCount * 3,
    });
  }

  return chartData;
};

export const getPostingTimes = async (userId: string): Promise<IPostingTimeData[]> => {
  const posts = await getPublishedPostsInRange(userId, 90);
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const heatmap = new Map<string, number>();

  days.forEach((day) => {
    for (let hour = 0; hour < 24; hour++) {
      heatmap.set(`${day}-${hour}`, 0);
    }
  });

  posts.forEach((post) => {
    const scheduled = post.scheduledTime || post.publishedAt || post.updatedAt;
    if (!scheduled) return;
    const d = dayjs(scheduled);
    const key = `${days[d.day()]}-${d.hour()}`;
    heatmap.set(key, (heatmap.get(key) || 0) + 1);
  });

  const data: IPostingTimeData[] = [];
  days.forEach((day) => {
    for (let hour = 0; hour < 24; hour++) {
      const score = heatmap.get(`${day}-${hour}`) || 0;
      data.push({
        day,
        hour: `${hour}:00`,
        score: Math.max(score, 1),
      });
    }
  });

  return data;
};

export const getTopPerforming = async (userId: string) => {
  const posts = await postsCore.getTopPerformingPostsForUser(userId, 5);

  return posts.map((post, idx) => {
    const contentScore = Math.min(post.content.length, 500);
    const baseImpressions = 200 + contentScore + (5 - idx) * 50;

    return {
      _id: post._id,
      content: post.content,
      media: post.media,
      publishedAt: post.publishedAt || post.updatedAt,
      accounts: post.linkedinAccounts,
      metrics: {
        impressions: baseImpressions,
        likes: Math.round(baseImpressions * 0.07),
        comments: Math.round(baseImpressions * 0.02),
        shares: Math.round(baseImpressions * 0.005),
      },
      source: 'estimated' as const,
    };
  });
};
