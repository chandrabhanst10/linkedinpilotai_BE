import express from 'express';
import {
  getDashboardSummary,
  getChartAnalytics,
  getBestPostingTimes,
  getTopPerformingPosts,
} from './controller.js';
import { protect } from '../../middlewares/auth.js';
import { validateQuery } from '../../middlewares/validate.js';
import { analyticsRangeSchema } from './validation.js';

const router = express.Router();

router.use(protect);

router.get('/summary', getDashboardSummary);
router.get('/charts', validateQuery(analyticsRangeSchema), getChartAnalytics);
router.get('/best-times', getBestPostingTimes);
router.get('/top-posts', getTopPerformingPosts);

export default router;
