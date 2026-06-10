import express from 'express';
import { protect } from '../../middlewares/auth.js';
import {
  redirectToLinkedIn,
  handleLinkedInCallback,
  getLinkedInStatus,
  disconnectLinkedIn
} from './controller.js';

const router = express.Router();

router.get('/auth', protect, redirectToLinkedIn);
router.get('/callback', handleLinkedInCallback);
router.get('/status', protect, getLinkedInStatus);
router.delete('/disconnect', protect, disconnectLinkedIn);

export default router;
