import express from 'express';
import {
  register,
  login,
  refresh,
  logout,
  forgotPassword,
  resetPassword,
  getMe,
  verifyEmail,
  resendVerification,
  getOAuthUrls,
  googleLogin,
  linkedinLogin,
} from './controller.js';
import { validateBody } from '../../middlewares/validate.js';
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyEmailSchema,
  resendVerificationSchema,
  oauthLoginSchema,
} from './validation.js';
import { protect } from '../../middlewares/auth.js';

const router = express.Router();

router.post('/register', validateBody(registerSchema), register);
router.post('/login', validateBody(loginSchema), login);
router.post('/refresh', refresh);
router.post('/logout', protect, logout);
router.post('/forgot-password', validateBody(forgotPasswordSchema), forgotPassword);
router.post('/reset-password', validateBody(resetPasswordSchema), resetPassword);
router.post('/verify-email', validateBody(verifyEmailSchema), verifyEmail);
router.post('/resend-verification', validateBody(resendVerificationSchema), resendVerification);
router.get('/oauth-urls', getOAuthUrls);
router.post('/google', validateBody(oauthLoginSchema), googleLogin);
router.post('/linkedin', validateBody(oauthLoginSchema), linkedinLogin);
router.get('/me', protect, getMe);

export default router;
