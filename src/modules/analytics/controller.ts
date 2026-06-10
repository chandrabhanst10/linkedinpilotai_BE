import { Request, Response, NextFunction } from 'express';
import * as analyticsService from './service.js';

export const getDashboardSummary = async (req: Request, res: Response, next: NextFunction): Promise<void | Response> => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }
    const summary = await analyticsService.getSummary(String(req.user._id));
    return res.status(200).json({ success: true, data: summary });
  } catch (error: unknown) {
    next(error);
  }
};

export const getChartAnalytics = async (req: Request, res: Response, next: NextFunction): Promise<void | Response> => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }
    const range = (req.query.range as string | undefined) || '7d';
    const chartData = await analyticsService.getCharts(String(req.user._id), range);
    return res.status(200).json({ success: true, data: chartData, meta: { source: 'database' } });
  } catch (error: unknown) {
    next(error);
  }
};

export const getBestPostingTimes = async (req: Request, res: Response, next: NextFunction): Promise<void | Response> => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }
    const times = await analyticsService.getPostingTimes(String(req.user._id));
    return res.status(200).json({ success: true, data: times, meta: { source: 'database' } });
  } catch (error: unknown) {
    next(error);
  }
};

export const getTopPerformingPosts = async (req: Request, res: Response, next: NextFunction): Promise<void | Response> => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }
    const formattedPosts = await analyticsService.getTopPerforming(String(req.user._id));
    return res.status(200).json({ success: true, data: formattedPosts, meta: { source: 'estimated' } });
  } catch (error: unknown) {
    next(error);
  }
};
