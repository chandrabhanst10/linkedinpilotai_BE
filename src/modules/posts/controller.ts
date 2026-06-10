import { Request, Response, NextFunction } from 'express';
import * as postsService from './service.js';
import { getParam } from '../../utils/params.js';

export const createPost = async (req: Request, res: Response, next: NextFunction): Promise<void | Response> => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }
    const { content, media, scheduledTime, status, linkedinAccounts } = req.body;

    if (!content) {
      return res.status(400).json({ success: false, message: 'Content is required' });
    }
    if (!scheduledTime) {
      return res.status(400).json({ success: false, message: 'Scheduled time is required' });
    }
    if (!linkedinAccounts || linkedinAccounts.length === 0) {
      return res.status(400).json({ success: false, message: 'Please select at least one LinkedIn account' });
    }

    const post = await postsService.schedulePost(
      String(req.user._id),
      content,
      scheduledTime,
      linkedinAccounts,
      media,
      status
    );

    return res.status(201).json({ success: true, data: post });
  } catch (error: unknown) {
    next(error);
  }
};

export const getPosts = async (req: Request, res: Response, next: NextFunction): Promise<void | Response> => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }
    const tab = req.query.tab as string | undefined;
    const search = req.query.search as string | undefined;
    const limitQuery = req.query.limit;
    const pageQuery = req.query.page;

    const limit = limitQuery ? parseInt(limitQuery as string, 10) : 10;
    const page = pageQuery ? parseInt(pageQuery as string, 10) : 1;

    const result = await postsService.listPosts(String(req.user._id), tab, search, limit, page);

    return res.status(200).json({
      success: true,
      data: result.posts,
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        pages: result.pages
      }
    });
  } catch (error: unknown) {
    next(error);
  }
};

export const getPostById = async (req: Request, res: Response, next: NextFunction): Promise<void | Response> => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }
    const post = await postsService.getSinglePost(getParam(req.params, 'id'), String(req.user._id));

    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    return res.status(200).json({ success: true, data: post });
  } catch (error: unknown) {
    next(error);
  }
};

export const updatePost = async (req: Request, res: Response, next: NextFunction): Promise<void | Response> => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }
    const { content, media, scheduledTime, status, linkedinAccounts } = req.body;
    
    const post = await postsService.editPost(getParam(req.params, 'id'), String(req.user._id), {
      content,
      media,
      scheduledTime,
      status,
      linkedinAccounts,
    });

    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    return res.status(200).json({ success: true, data: post });
  } catch (error: unknown) {
    next(error);
  }
};

export const deletePost = async (req: Request, res: Response, next: NextFunction): Promise<void | Response> => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }
    const post = await postsService.removePost(getParam(req.params, 'id'), String(req.user._id));
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    return res.status(200).json({ success: true, message: 'Post deleted successfully' });
  } catch (error: unknown) {
    next(error);
  }
};

export const duplicatePost = async (req: Request, res: Response, next: NextFunction): Promise<void | Response> => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }
    const duplicated = await postsService.clonePost(getParam(req.params, 'id'), String(req.user._id));
    if (!duplicated) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    return res.status(201).json({ success: true, data: duplicated });
  } catch (error: unknown) {
    next(error);
  }
};

export const retryPost = async (req: Request, res: Response, next: NextFunction): Promise<void | Response> => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }
    const post = await postsService.reprocessPost(getParam(req.params, 'id'), String(req.user._id));
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    return res.status(200).json({ success: true, message: 'Post scheduled for immediate retry', data: post });
  } catch (error: unknown) {
    next(error);
  }
};
