import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { getQueryParam } from '../../utils/params.js';
import { getErrorMessage } from '../../utils/errors.js';
import { isOAuthStatePayload } from './types.js';
import * as linkedinService from './service.js';

export const redirectToLinkedIn = async (req: Request, res: Response, next: NextFunction): Promise<void | Response> => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }
    const clientId = process.env.LINKEDIN_CLIENT_ID;
    const redirectUri = process.env.LINKEDIN_REDIRECT_URI;

    if (!clientId || !redirectUri) {
      return res.status(400).json({ success: false, message: 'LinkedIn client ID or redirect URI is not configured.' });
    }

    const state = jwt.sign(
      { userId: String(req.user._id) },
      process.env.JWT_SECRET || 'fallback_access_secret',
      { expiresIn: '15m' }
    );

    const scopes = ['openid', 'profile', 'email', 'w_member_social'];
    const authUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}&scope=${encodeURIComponent(scopes.join(' '))}`;

    return res.redirect(authUrl);
  } catch (error: unknown) {
    next(error);
  }
};

export const handleLinkedInCallback = async (req: Request, res: Response, next: NextFunction): Promise<void | Response> => {
  const code = getQueryParam(req.query, 'code');
  const state = getQueryParam(req.query, 'state');
  const error = getQueryParam(req.query, 'error');
  const error_description = getQueryParam(req.query, 'error_description');

  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';

  if (error) {
    return res.redirect(`${clientUrl}/settings?tab=linkedin&error=${encodeURIComponent(error_description || error)}`);
  }

  try {
    if (!state) {
      return res.redirect(`${clientUrl}/settings?tab=linkedin&error=state_missing`);
    }

    let decoded: jwt.JwtPayload | string | null = null;
    try {
      decoded = jwt.verify(state, process.env.JWT_SECRET || 'fallback_access_secret');
    } catch {
      return res.redirect(`${clientUrl}/settings?tab=linkedin&error=state_invalid_or_expired`);
    }

    if (!decoded || !isOAuthStatePayload(decoded)) {
      return res.redirect(`${clientUrl}/settings?tab=linkedin&error=state_missing_user_context`);
    }

    const { userId } = decoded;

    await linkedinService.connectConnection(userId, code);

    return res.redirect(`${clientUrl}/settings?tab=linkedin&success=connected`);
  } catch (err: unknown) {
    console.error('LinkedIn callback processing error:', err);
    return res.redirect(`${clientUrl}/settings?tab=linkedin&error=${encodeURIComponent(getErrorMessage(err, 'callback_failed'))}`);
  }
};

export const getLinkedInStatus = async (req: Request, res: Response, next: NextFunction): Promise<void | Response> => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }
    const connection = await linkedinService.getConnectionByUserId(String(req.user._id));
    if (!connection) {
      return res.status(200).json({ success: true, connected: false });
    }

    return res.status(200).json({
      success: true,
      connected: true,
      data: {
        name: connection.name,
        email: connection.email,
        connectedAt: connection.connectedAt,
        expiresAt: connection.expiresAt,
      },
    });
  } catch (error: unknown) {
    next(error);
  }
};

export const disconnectLinkedIn = async (req: Request, res: Response, next: NextFunction): Promise<void | Response> => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }
    const result = await linkedinService.removeConnectionByUserId(String(req.user._id));
    if (!result) {
      return res.status(404).json({ success: false, message: 'No connected LinkedIn profile connection found.' });
    }

    return res.status(200).json({ success: true, message: 'LinkedIn connection removed successfully.' });
  } catch (error: unknown) {
    next(error);
  }
};
