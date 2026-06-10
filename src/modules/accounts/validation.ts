import { z } from 'zod';

export const connectAccountSchema = z.object({
  linkedinId: z.string().optional(),
  name: z.string().min(1).max(100).optional(),
  avatar: z.string().url().optional(),
});

export const accountIdParamSchema = z.object({
  id: z.string().min(1),
});
