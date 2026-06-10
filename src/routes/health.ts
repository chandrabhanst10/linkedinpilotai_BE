import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { isRedisReady } from '../config/redis.js';
import { getIntegrationStatuses } from '../config/integrations.js';

const router = Router();

router.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

router.get('/ready', (_req: Request, res: Response) => {
  const mongoReady = mongoose.connection.readyState === 1;
  const redisReady = isRedisReady();
  const isProduction = process.env.NODE_ENV === 'production';
  const ready = mongoReady && (!isProduction || redisReady);

  res.status(ready ? 200 : 503).json({
    success: ready,
    status: ready ? 'ready' : 'not_ready',
    checks: {
      mongodb: mongoReady,
      redis: redisReady,
      redisRequired: isProduction,
    },
    timestamp: new Date().toISOString(),
  });
});

router.get('/integrations', (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    data: getIntegrationStatuses(),
  });
});

export default router;
