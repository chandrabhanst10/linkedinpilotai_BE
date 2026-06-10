export interface IChartDataPoint {
  date: string;
  impressions: number;
  likes: number;
  comments: number;
  shares: number;
  clicks: number;
}

export interface IPostingTimeData {
  day: string;
  hour: string;
  score: number;
}

export interface IAnalyticsSummaryStats {
  total: number;
  scheduled: number;
  published: number;
  failed: number;
}

export interface ILinkedInAccountSummary {
  name?: string;
  avatar?: string;
}

export interface IAnalyticsSummary {
  stats: IAnalyticsSummaryStats;
  upcoming: Array<{
    _id: string;
    content: string;
    scheduledTime: Date;
    linkedinAccounts: ILinkedInAccountSummary[];
  }>;
  activities: Array<{
    _id: string;
    content: string;
    status: 'published' | 'posted' | 'failed';
    updatedAt: Date;
  }>;
}

export interface ITopPerformingPost {
  _id: string;
  content: string;
  media: Array<{ url: string; type: 'image' | 'video'; publicId?: string }>;
  publishedAt: Date | null | undefined;
  accounts: ILinkedInAccountSummary[];
  metrics: {
    impressions: number;
    likes: number;
    comments: number;
    shares: number;
  };
}
