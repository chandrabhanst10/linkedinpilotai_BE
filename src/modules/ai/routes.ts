import express from 'express';
import { generatePost, improvePost, generateCTA } from './controller.js';
import { protect } from '../../middlewares/auth.js';
import { validateBody } from '../../middlewares/validate.js';
import { generatePostSchema, improvePostSchema, generateCTASchema } from './validation.js';
import rateLimit from 'express-rate-limit';

const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'AI rate limit exceeded. Try again later.' },
});

const router = express.Router();

router.use(protect);
router.use(aiLimiter);

router.post('/generate', validateBody(generatePostSchema), generatePost);
router.post('/improve', validateBody(improvePostSchema), improvePost);
router.post('/cta', validateBody(generateCTASchema), generateCTA);

export default router;
