import express from 'express';
import { getAccounts, connectAccount, disconnectAccount } from './controller.js';
import { protect } from '../../middlewares/auth.js';
import { validateBody, validateParams } from '../../middlewares/validate.js';
import { connectAccountSchema, accountIdParamSchema } from './validation.js';

const router = express.Router();

router.use(protect);

router.get('/', getAccounts);
router.post('/connect', validateBody(connectAccountSchema), connectAccount);
router.delete('/:id', validateParams(accountIdParamSchema), disconnectAccount);

export default router;
