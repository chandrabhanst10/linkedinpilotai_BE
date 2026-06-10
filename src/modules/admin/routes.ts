import express from 'express';
import {
  getSystemStats,
  getUsersList,
  deleteUser,
  updateRole,
  getFailedJobs,
} from './controller.js';
import { protect, adminOnly } from '../../middlewares/auth.js';
import { validateBody, validateParams } from '../../middlewares/validate.js';
import { updateUserRoleSchema, adminUserIdParamSchema } from './validation.js';

const router = express.Router();

router.use(protect);
router.use(adminOnly);

router.get('/stats', getSystemStats);
router.get('/users', getUsersList);
router.delete('/users/:id', validateParams(adminUserIdParamSchema), deleteUser);
router.put('/users/:id/role', validateParams(adminUserIdParamSchema), validateBody(updateUserRoleSchema), updateRole);
router.get('/failed-jobs', getFailedJobs);

export default router;
