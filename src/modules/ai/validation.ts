import { z } from 'zod';

export const generatePostSchema = z.object({
  topic: z.string().min(1, 'Topic is required').max(500),
  tone: z.enum(['professional', 'casual', 'bold', 'persuasive', 'empathetic']).optional().default('professional'),
});

export const improvePostSchema = z.object({
  content: z.string().min(1, 'Content is required').max(3000),
  action: z.enum(['shorten', 'expand', 'improve']),
});

export const generateCTASchema = z.object({
  tone: z.enum(['professional', 'casual', 'bold', 'persuasive', 'empathetic']).optional(),
});
