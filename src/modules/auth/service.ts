import mongoose from 'mongoose';
import * as authCore from './core/index.js';
import * as settingsCore from '../settings/core/index.js';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../../utils/jwt.js';
import { sendVerificationEmail, verifyEmailStatus } from '../../services/firebaseEmailService.js';
import { IUserDocument } from '../../types/types.js';

export const registerUser = async (name: string, email: string, password?: string) => {
  const userExists = await authCore.findUserByEmail(email);
  if (userExists) {
    throw new Error('User already exists with this email');
  }

  // Create user
  const user = await authCore.createUser({ name, email, password });

  // Create default workspace
  await settingsCore.createWorkspace({
    name: `${name}'s Workspace`,
    owner: user._id as mongoose.Types.ObjectId,
    members: [{ user: user._id as mongoose.Types.ObjectId, role: 'owner' }],
  });

  // Create default trial subscription
  await settingsCore.createSubscription({
    user: user._id as mongoose.Types.ObjectId,
    plan: 'free',
    status: 'active',
  });

  // Send verification email
  try {
    await sendVerificationEmail(email);
  } catch (emailError: unknown) {
    console.error('Failed to send verification email during registration:', emailError);
  }

  return user;
};

export const loginUser = async (email: string, password?: string) => {
  const user = await authCore.findUserByEmailWithPassword(email);
  if (!user) {
    return { success: false, status: 401, message: 'Invalid credentials' };
  }

  if (!user.password) {
    return {
      success: false,
      status: 400,
      message: 'This account was registered via Google or LinkedIn. Please sign in using your social provider.'
    };
  }

  const isMatch = await user.comparePassword(password || '');
  if (!isMatch) {
    return { success: false, status: 401, message: 'Invalid credentials' };
  }

  // Sync email verification status
  if (!user.isVerified) {
    const isNowVerified = await verifyEmailStatus(email);
    if (isNowVerified) {
      user.isVerified = true;
      await user.save();
    } else {
      return {
        success: false,
        status: 401,
        isVerified: false,
        message: 'Your email address is not verified. Please verify your email first.',
        email: user.email,
      };
    }
  }

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  user.refreshToken = refreshToken;
  await user.save();

  return {
    success: true,
    accessToken,
    refreshToken,
    user
  };
};

export const refreshUserToken = async (token: string) => {
  const decoded = verifyRefreshToken(token);
  if (!decoded) {
    return null;
  }

  const user = await authCore.findUserById(decoded.id);
  if (!user || user.refreshToken !== token) {
    return null;
  }

  const newAccessToken = generateAccessToken(user);
  const newRefreshToken = generateRefreshToken(user);

  user.refreshToken = newRefreshToken;
  await user.save();

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
  };
};

export const logoutUser = async (user: IUserDocument) => {
  user.refreshToken = null;
  await user.save();
};

export const forgotPasswordUser = async (email: string) => {
  const user = await authCore.findUserByEmail(email);
  if (!user) {
    throw new Error('No user found with that email');
  }

  // Generate a random 6-digit verification code
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  
  user.resetPasswordCode = code;
  user.resetPasswordExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 mins expiry
  await user.save();

  // Log code in dev environment for easy verification/mock access
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[RESET PASSWORD CODE for ${email}]: ${code}`);
  }
  return true;
};

export const resetPasswordUser = async (email: string, code: string, password?: string) => {
  const user = await authCore.findUserByEmail(email);
  if (!user) {
    throw new Error('User not found');
  }

  const isProduction = process.env.NODE_ENV === 'production';
  const isMockBypass = !isProduction && code === '123456';

  const isCodeValid = user.resetPasswordCode === code && 
    user.resetPasswordExpires && 
    user.resetPasswordExpires > new Date();

  if (!isMockBypass && !isCodeValid) {
    throw new Error('Invalid or expired verification code');
  }

  user.password = password;
  user.refreshToken = null;
  user.resetPasswordCode = null;
  user.resetPasswordExpires = null;
  await user.save();
  return user;
};

export const verifyUserEmail = async (email: string, token?: string) => {
  const user = await authCore.findUserByEmail(email);
  if (!user) {
    return { success: false, status: 404, message: 'User not found' };
  }

  if (user.isVerified) {
    return { success: true, message: 'Email is already verified.' };
  }

  const isVerified = await verifyEmailStatus(email, token);
  if (!isVerified) {
    return { success: false, status: 400, message: 'Invalid or expired verification link.' };
  }

  user.isVerified = true;
  await user.save();

  return { success: true, message: 'Email verified successfully.' };
};

export const handleGoogleLogin = async (code: string, mockEmail?: string, mockName?: string) => {
  const hasGoogle = !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && process.env.GOOGLE_REDIRECT_URI);

  let googleId: string;
  let email: string;
  let name: string;

  if (!hasGoogle || code.startsWith('mock_')) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Mock authentication is disabled in production.');
    }
    email = mockEmail || 'mockgoogle@linkpilot.ai';
    name = mockName || 'Google Mock User';
    googleId = `g_mock_${Math.random().toString(36).substring(2, 9)}`;
  } else {
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID || '',
        client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
        redirect_uri: process.env.GOOGLE_REDIRECT_URI || '',
        grant_type: 'authorization_code'
      })
    });

    const tokenData = (await tokenResponse.json()) as { access_token?: string; error_description?: string };
    if (!tokenResponse.ok) {
      throw new Error(tokenData.error_description || 'Failed to exchange Google OAuth code.');
    }

    const profileResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` }
    });

    const profileData = (await profileResponse.json()) as { sub: string; email: string; name: string };
    if (!profileResponse.ok) {
      throw new Error('Failed to retrieve Google profile data.');
    }

    googleId = profileData.sub;
    email = profileData.email;
    name = profileData.name;
  }

  if (!email) {
    throw new Error('Google profile did not return an email address.');
  }

  let user = await authCore.findUserByGoogleOrEmail(googleId, email);
  if (!user) {
    user = await authCore.createUser({
      name: name || 'Google User',
      email,
      googleId,
      isVerified: true
    });

    await settingsCore.createWorkspace({
      name: `${user.name}'s Workspace`,
      owner: user._id as mongoose.Types.ObjectId,
      members: [{ user: user._id as mongoose.Types.ObjectId, role: 'owner' }],
    });

    await settingsCore.createSubscription({
      user: user._id as mongoose.Types.ObjectId,
      plan: 'free',
      status: 'active',
    });
  } else {
    if (!user.googleId) {
      user.googleId = googleId;
    }
    user.isVerified = true;
    await user.save();
  }

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);
  user.refreshToken = refreshToken;
  await user.save();

  return { user, accessToken, refreshToken };
};

export const handleLinkedinLogin = async (code: string, mockEmail?: string, mockName?: string) => {
  const hasLinkedin = !!(process.env.LINKEDIN_CLIENT_ID && process.env.LINKEDIN_CLIENT_SECRET && process.env.LINKEDIN_REDIRECT_URI);

  let linkedinId: string;
  let email: string;
  let name: string;

  if (!hasLinkedin || code.startsWith('mock_')) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Mock authentication is disabled in production.');
    }
    email = mockEmail || 'mocklinkedin@linkpilot.ai';
    name = mockName || 'LinkedIn Mock User';
    linkedinId = `l_mock_${Math.random().toString(36).substring(2, 9)}`;
  } else {
    const tokenResponse = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.LINKEDIN_CLIENT_ID || '',
        client_secret: process.env.LINKEDIN_CLIENT_SECRET || '',
        redirect_uri: process.env.LINKEDIN_REDIRECT_URI || '',
        grant_type: 'authorization_code'
      })
    });

    const tokenData = (await tokenResponse.json()) as { access_token?: string; error_description?: string };
    if (!tokenResponse.ok) {
      throw new Error(tokenData.error_description || 'Failed to exchange LinkedIn OAuth code.');
    }

    const profileResponse = await fetch('https://api.linkedin.com/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` }
    });

    const profileData = (await profileResponse.json()) as { sub: string; email: string; name: string };
    if (!profileResponse.ok) {
      throw new Error('Failed to retrieve LinkedIn profile data.');
    }

    linkedinId = profileData.sub;
    email = profileData.email;
    name = profileData.name;
  }

  if (!email) {
    throw new Error('LinkedIn profile did not return an email address.');
  }

  let user = await authCore.findUserByLinkedinOrEmail(linkedinId, email);
  if (!user) {
    user = await authCore.createUser({
      name: name || 'LinkedIn User',
      email,
      linkedinId,
      isVerified: true
    });

    await settingsCore.createWorkspace({
      name: `${user.name}'s Workspace`,
      owner: user._id as mongoose.Types.ObjectId,
      members: [{ user: user._id as mongoose.Types.ObjectId, role: 'owner' }],
    });

    await settingsCore.createSubscription({
      user: user._id as mongoose.Types.ObjectId,
      plan: 'free',
      status: 'active',
    });
  } else {
    if (!user.linkedinId) {
      user.linkedinId = linkedinId;
    }
    user.isVerified = true;
    await user.save();
  }

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);
  user.refreshToken = refreshToken;
  await user.save();

  return { user, accessToken, refreshToken };
};
