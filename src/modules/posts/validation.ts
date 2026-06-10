import { z } from 'zod';

export const mediaSchema = z.object({
  url: z.string().url(),
  type: z.enum(['image', 'video']),
  publicId: z.string().optional(),
});

export const schedulePostSchema = z.object({
  content: z.string().min(1, 'Content is required').max(3000),
  scheduledTime: z.string().min(1, 'Scheduled time is required'),
  linkedinAccounts: z.array(z.string().min(1)).min(1, 'Select at least one LinkedIn account'),
  media: z.array(mediaSchema).optional().default([]),
  status: z.enum(['draft', 'scheduled']).optional(),
});

export const updatePostSchema = z.object({
  content: z.string().min(1).max(3000).optional(),
  scheduledTime: z.string().min(1).optional(),
  linkedinAccounts: z.array(z.string().min(1)).min(1).optional(),
  media: z.array(mediaSchema).optional(),
  status: z.enum(['draft', 'scheduled', 'failed']).optional(),
});

export const postsQuerySchema = z.object({
  tab: z.string().optional(),
  search: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional().default(10),
  page: z.coerce.number().int().min(1).optional().default(1),
});

export const postIdParamSchema = z.object({
  id: z.string().min(1),
});
