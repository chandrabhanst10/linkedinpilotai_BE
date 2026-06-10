import type { JwtPayload } from 'jsonwebtoken';

export interface ILinkedInTokenResponse {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  refresh_token_expires_in?: number;
  scope: string;
}

export interface ILinkedInProfileResponse {
  sub: string;
  name: string;
  given_name: string;
  family_name: string;
  picture?: string;
  email: string;
}

export interface OAuthStatePayload extends JwtPayload {
  userId: string;
}

export const isOAuthStatePayload = (value: JwtPayload | string): value is OAuthStatePayload =>
  typeof value === 'object' &&
  value !== null &&
  'userId' in value &&
  typeof value.userId === 'string';
