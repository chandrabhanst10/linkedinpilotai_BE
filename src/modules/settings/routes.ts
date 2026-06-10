import express from 'express';
import {
  updateProfile,
  updatePassword,
  getBillingDetails,
  updateBillingPlan,
} from './controller.js';
import { protect } from '../../middlewares/auth.js';
import { validateBody } from '../../middlewares/validate.js';
import { updateProfileSchema, updatePasswordSchema, changePlanSchema } from './validation.js';

const router = express.Router();

router.use(protect);

router.put('/profile', validateBody(updateProfileSchema), updateProfile);
router.put('/password', validateBody(updatePasswordSchema), updatePassword);
router.get('/billing', getBillingDetails);
router.put('/billing', validateBody(changePlanSchema), updateBillingPlan);

export default router;
