import jwt from 'jsonwebtoken';

import mongoose from 'mongoose';

const ACCESS_TOKEN_SECRET = process.env.JWT_SECRET || 'fallback_access_secret';
const REFRESH_TOKEN_SECRET = process.env.JWT_REFRESH_SECRET || 'fallback_refresh_secret';

export interface IUserTokenPayload {
  _id: string | mongoose.Types.ObjectId;
  email: string;
  role: string;
}

export interface IDecodedToken {
  id: string;
  email: string;
  role: string;
  iat: number;
  exp: number;
}

export const generateAccessToken = (user: IUserTokenPayload): string => {
  return jwt.sign(
    { id: String(user._id), email: user.email, role: user.role },
    ACCESS_TOKEN_SECRET,
    { expiresIn: '15m' }
  );
};

export const generateRefreshToken = (user: { _id: string | mongoose.Types.ObjectId }): string => {
  return jwt.sign(
    { id: String(user._id) },
    REFRESH_TOKEN_SECRET,
    { expiresIn: '7d' }
  );
};

export const verifyAccessToken = (token: string): IDecodedToken | null => {
  try {
    return jwt.verify(token, ACCESS_TOKEN_SECRET) as IDecodedToken;
  } catch (error: unknown) {
    return null;
  }
};

export const verifyRefreshToken = (token: string): { id: string } | null => {
  try {
    return jwt.verify(token, REFRESH_TOKEN_SECRET) as { id: string };
  } catch (error: unknown) {
    return null;
  }
};
