import mongoose from 'mongoose';
import { isRedisReady } from './redis.js';

const hasAll = (keys: string[]): boolean => keys.every((key) => Boolean(process.env[key]));

export interface IntegrationStatus {
  name: string;
  configured: boolean;
  ready: boolean;
  message: string;
}

export const isMockIntegrationsEnabled = (): boolean =>
  process.env.NODE_ENV !== 'production' && process.env.ENABLE_MOCK_INTEGRATIONS === 'true';

export const isFirebaseConfigured = (): boolean =>
  hasAll(['FIREBASE_PROJECT_ID', 'FIREBASE_CLIENT_EMAIL', 'FIREBASE_PRIVATE_KEY', 'FIREBASE_API_KEY']);

export const isLinkedInOAuthConfigured = (): boolean =>
  hasAll(['LINKEDIN_CLIENT_ID', 'LINKEDIN_CLIENT_SECRET', 'LINKEDIN_REDIRECT_URI']);

export const isGeminiConfigured = (): boolean => Boolean(process.env.GEMINI_API_KEY);

export const isCloudinaryConfigured = (): boolean =>
  hasAll(['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET']);

export const isGoogleOAuthConfigured = (): boolean =>
  hasAll(['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET']);

export const getApiBaseUrl = (): string =>
  process.env.API_BASE_URL || process.env.SERVER_URL || `http://localhost:${process.env.PORT || 5001}`;

export const getIntegrationStatuses = (): IntegrationStatus[] => {
  const mongoReady = mongoose.connection.readyState === 1;
  const redisReady = isRedisReady();

  return [
    {
      name: 'mongodb',
      configured: Boolean(process.env.MONGO_URI),
      ready: mongoReady,
      message: mongoReady ? 'Connected' : 'Not connected',
    },
    {
      name: 'redis',
      configured: Boolean(process.env.REDIS_URL),
      ready: redisReady,
      message: redisReady ? 'Connected' : 'Unavailable — BullMQ uses fallback in development only',
    },
    {
      name: 'linkedin_oauth',
      configured: isLinkedInOAuthConfigured(),
      ready: isLinkedInOAuthConfigured(),
      message: isLinkedInOAuthConfigured()
        ? 'OAuth credentials configured'
        : 'Set LINKEDIN_CLIENT_ID, LINKEDIN_CLIENT_SECRET, LINKEDIN_REDIRECT_URI',
    },
    {
      name: 'google_oauth',
      configured: isGoogleOAuthConfigured(),
      ready: isGoogleOAuthConfigured(),
      message: isGoogleOAuthConfigured()
        ? 'Google OAuth configured'
        : 'Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET',
    },
    {
      name: 'gemini_ai',
      configured: isGeminiConfigured(),
      ready: isGeminiConfigured(),
      message: isGeminiConfigured() ? 'Gemini API key configured' : 'Set GEMINI_API_KEY for live AI generation',
    },
    {
      name: 'firebase_email',
      configured: isFirebaseConfigured(),
      ready: isFirebaseConfigured(),
      message: isFirebaseConfigured() ? 'Firebase email configured' : 'Set Firebase env vars for production email',
    },
    {
      name: 'cloudinary',
      configured: isCloudinaryConfigured(),
      ready: isCloudinaryConfigured(),
      message: isCloudinaryConfigured() ? 'Cloudinary configured' : 'Set Cloudinary env vars for media uploads',
    },
    {
      name: 'mock_integrations',
      configured: isMockIntegrationsEnabled(),
      ready: isMockIntegrationsEnabled(),
      message: isMockIntegrationsEnabled()
        ? 'Mock LinkedIn connect and simulated publishing enabled (development only)'
        : 'Disabled — use real OAuth and credentials',
    },
  ];
};
