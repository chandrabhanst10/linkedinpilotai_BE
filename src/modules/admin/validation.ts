import { z } from 'zod';

export const updateUserRoleSchema = z.object({
  role: z.enum(['user', 'admin']),
});

export const adminUserIdParamSchema = z.object({
  id: z.string().min(1),
});
