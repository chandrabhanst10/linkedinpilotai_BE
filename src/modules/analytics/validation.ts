import { z } from 'zod';

export const analyticsRangeSchema = z.object({
  range: z.enum(['7d', '30d', '90d']).optional().default('7d'),
});
