import { Request, Response, NextFunction } from 'express';
import { User } from '../modules/auth/index.js';
import { IUserDocument } from '../types/types.js';
import { verifyAccessToken } from '../utils/jwt.js';
import { getQueryParam } from '../utils/params.js';

declare global {
  namespace Express {
    interface Request {
      user?: IUserDocument;
    }
  }
}

export const protect = async (req: Request, res: Response, next: NextFunction): Promise<void | Response> => {
  let token: string | undefined;

  // Extract from cookies
  const cookieHeader = req.headers.cookie;
  if (cookieHeader) {
    const cookies: Record<string, string> = {};
    cookieHeader.split(';').forEach((cookie) => {
      const parts = cookie.split('=');
      const name = parts[0].trim();
      const value = parts.slice(1).join('=');
      cookies[name] = decodeURIComponent(value);
    });
    if (cookies.accessToken) {
      token = cookies.accessToken;
    }
  }

  // Fallback to headers or query params
  if (!token) {
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    } else if (process.env.NODE_ENV !== 'production') {
      const queryToken = getQueryParam(req.query, 'token');
      if (queryToken) {
        token = queryToken;
      }
    }
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized, token missing' });
  }

  try {
    const decoded = verifyAccessToken(token);
    if (!decoded) {
      return res.status(401).json({ success: false, message: 'Not authorized, token expired or invalid' });
    }

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Not authorized, user not found' });
    }

    req.user = user;
    next();
  } catch (error: unknown) {
    console.error('Auth middleware error:', error);
    return res.status(401).json({ success: false, message: 'Not authorized, token failed' });
  }
};

export const adminOnly = (req: Request, res: Response, next: NextFunction): void | Response => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return res.status(403).json({ success: false, message: 'Forbidden, admin access only' });
  }
};
