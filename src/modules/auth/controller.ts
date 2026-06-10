import { Request, Response, NextFunction } from 'express';
import * as authService from './service.js';
import * as authCore from './core/index.js';

const setAuthCookies = (res: Response, accessToken: string, refreshToken: string): void => {
  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 15 * 60 * 1000,
    path: '/',
  });
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
  });
};

export const register = async (req: Request, res: Response, next: NextFunction): Promise<void | Response> => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide all details' });
    }

    const user = await authService.registerUser(name, email, password);

    return res.status(201).json({
      success: true,
      isVerified: false,
      message: 'Registration successful. A verification link has been sent to your email.',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: false,
      },
    });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'User already exists with this email') {
      return res.status(400).json({ success: false, message: error.message });
    }
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void | Response> => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    const result = await authService.loginUser(email, password);
    if (!result.success) {
      return res.status(result.status || 400).json({
        success: false,
        message: result.message,
        email: result.email,
        isVerified: result.isVerified
      });
    }

    if (result.accessToken && result.refreshToken) {
      setAuthCookies(res, result.accessToken, result.refreshToken);
    }

    return res.status(200).json({
      success: true,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      user: {
        id: result.user?._id,
        name: result.user?.name,
        email: result.user?.email,
        role: result.user?.role,
        isVerified: result.user?.isVerified,
      },
    });
  } catch (error: unknown) {
    next(error);
  }
};

export const refresh = async (req: Request, res: Response, next: NextFunction): Promise<void | Response> => {
  try {
    let token = req.body.token as string | undefined;

    // Fallback to cookie
    if (!token && req.headers.cookie) {
      const cookies: Record<string, string> = {};
      req.headers.cookie.split(';').forEach((cookie) => {
        const parts = cookie.split('=');
        const name = parts[0].trim();
        const value = parts.slice(1).join('=');
        cookies[name] = decodeURIComponent(value);
      });
      if (cookies.refreshToken) {
        token = cookies.refreshToken;
      }
    }

    if (!token) {
      return res.status(400).json({ success: false, message: 'Refresh token is required' });
    }

    const result = await authService.refreshUserToken(token);
    if (!result) {
      return res.status(401).json({ success: false, message: 'Invalid or expired refresh token' });
    }

    setAuthCookies(res, result.accessToken, result.refreshToken);

    return res.status(200).json({
      success: true,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    });
  } catch (error: unknown) {
    next(error);
  }
};

export const logout = async (req: Request, res: Response, next: NextFunction): Promise<void | Response> => {
  try {
    if (req.user) {
      await authService.logoutUser(req.user);
    }
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
    return res.status(200).json({ success: true, message: 'Logged out successfully' });
  } catch (error: unknown) {
    next(error);
  }
};

export const forgotPassword = async (req: Request, res: Response, next: NextFunction): Promise<void | Response> => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    await authService.forgotPasswordUser(email);

    const message =
      process.env.NODE_ENV === 'production'
        ? 'If an account exists for that email, a reset verification code has been sent.'
        : 'Reset verification code sent to email. Use code "123456" for testing reset.';

    return res.status(200).json({ success: true, message });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'No user found with that email') {
      return res.status(404).json({ success: false, message: error.message });
    }
    next(error);
  }
};

export const resetPassword = async (req: Request, res: Response, next: NextFunction): Promise<void | Response> => {
  try {
    const { email, code, newPassword } = req.body;
    if (!email || !code || !newPassword) {
      return res.status(400).json({ success: false, message: 'Email, code, and new password are required' });
    }

    await authService.resetPasswordUser(email, code, newPassword);

    return res.status(200).json({ success: true, message: 'Password reset successful' });
  } catch (error: unknown) {
    if (error instanceof Error && (error.message === 'Invalid verification code' || error.message === 'User not found')) {
      return res.status(error.message === 'User not found' ? 404 : 400).json({ success: false, message: error.message });
    }
    next(error);
  }
};

export const getMe = async (req: Request, res: Response, next: NextFunction): Promise<void | Response> => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }
    const user = await authCore.findUserById(String(req.user._id));
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    return res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
      },
    });
  } catch (error: unknown) {
    next(error);
  }
};

export const verifyEmail = async (req: Request, res: Response, next: NextFunction): Promise<void | Response> => {
  try {
    const { email, token } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const result = await authService.verifyUserEmail(email, token);
    if (!result.success) {
      return res.status(result.status || 400).json({ success: false, message: result.message });
    }

    return res.status(200).json({ success: true, message: result.message });
  } catch (error: unknown) {
    next(error);
  }
};

export const resendVerification = async (req: Request, res: Response, next: NextFunction): Promise<void | Response> => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const user = await authCore.findUserByEmail(email);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.isVerified) {
      return res.status(400).json({ success: false, message: 'Email is already verified.' });
    }

    await authService.registerUser(user.name, user.email); // Re-sends validation or similar logic

    return res.status(200).json({ success: true, message: 'Verification email sent successfully.' });
  } catch (error: unknown) {
    next(error);
  }
};

export const getOAuthUrls = async (req: Request, res: Response, next: NextFunction): Promise<void | Response> => {
  try {
    const hasGoogle = !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && process.env.GOOGLE_REDIRECT_URI);
    const hasLinkedin = !!(process.env.LINKEDIN_CLIENT_ID && process.env.LINKEDIN_CLIENT_SECRET && process.env.LINKEDIN_REDIRECT_URI);

    const googleUrl = hasGoogle
      ? `https://accounts.google.com/o/oauth2/v2/auth?client_id=${process.env.GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(process.env.GOOGLE_REDIRECT_URI || '')}&response_type=code&scope=openid%20profile%20email&prompt=select_account`
      : '';

    const linkedinUrl = hasLinkedin
      ? `https://www.linkedin.com/oauth/v2/authorization?client_id=${process.env.LINKEDIN_CLIENT_ID}&redirect_uri=${encodeURIComponent(process.env.LINKEDIN_REDIRECT_URI || '')}&response_type=code&scope=openid%20profile%20email`
      : '';

    return res.status(200).json({
      success: true,
      googleUrl,
      linkedinUrl,
      isGoogleMock: !hasGoogle,
      isLinkedinMock: !hasLinkedin
    });
  } catch (error: unknown) {
    next(error);
  }
};

export const googleLogin = async (req: Request, res: Response, next: NextFunction): Promise<void | Response> => {
  try {
    const { code, email: mockEmail, name: mockName } = req.body;
    if (!code) {
      return res.status(400).json({ success: false, message: 'OAuth authorization code is required' });
    }

    const { user, accessToken, refreshToken } = await authService.handleGoogleLogin(code, mockEmail, mockName);

    setAuthCookies(res, accessToken, refreshToken);

    return res.status(200).json({
      success: true,
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified
      }
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      return res.status(400).json({ success: false, message: error.message });
    }
    next(error);
  }
};

export const linkedinLogin = async (req: Request, res: Response, next: NextFunction): Promise<void | Response> => {
  try {
    const { code, email: mockEmail, name: mockName } = req.body;
    if (!code) {
      return res.status(400).json({ success: false, message: 'OAuth authorization code is required' });
    }

    const { user, accessToken, refreshToken } = await authService.handleLinkedinLogin(code, mockEmail, mockName);

    setAuthCookies(res, accessToken, refreshToken);

    return res.status(200).json({
      success: true,
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified
      }
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      return res.status(400).json({ success: false, message: error.message });
    }
    next(error);
  }
};
