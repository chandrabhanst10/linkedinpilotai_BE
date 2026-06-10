import { Request, Response, NextFunction } from 'express';
import * as aiService from './service.js';

export const generatePost = async (req: Request, res: Response, next: NextFunction): Promise<void | Response> => {
  try {
    const { topic, tone } = req.body;
    if (!topic) {
      return res.status(400).json({ success: false, message: 'Topic is required' });
    }

    const caption = await aiService.generateCaption(topic, tone);
    const hashtags = await aiService.generateHashtags(caption);

    return res.status(200).json({
      success: true,
      data: {
        caption,
        hashtags,
        fullText: `${caption}\n\n${hashtags}`
      }
    });
  } catch (error: unknown) {
    next(error);
  }
};

export const improvePost = async (req: Request, res: Response, next: NextFunction): Promise<void | Response> => {
  try {
    const { content, action } = req.body;
    if (!content) {
      return res.status(400).json({ success: false, message: 'Content is required' });
    }
    if (!action) {
      return res.status(400).json({ success: false, message: 'Action (shorten, expand, improve) is required' });
    }

    const result = await aiService.improveContent(content, action);
    return res.status(200).json({
      success: true,
      data: {
        original: content,
        improved: result
      }
    });
  } catch (error: unknown) {
    next(error);
  }
};

export const generateCTA = async (req: Request, res: Response, next: NextFunction): Promise<void | Response> => {
  try {
    const { tone } = req.body;
    const cta = await aiService.generateCTA(tone);
    return res.status(200).json({
      success: true,
      data: {
        cta
      }
    });
  } catch (error: unknown) {
    next(error);
  }
};
