import { isLinkedInOAuthConfigured, isFirebaseConfigured } from './integrations.js';

const REQUIRED_IN_PRODUCTION = [
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
  'ENCRYPTION_KEY',
  'MONGO_URI',
  'REDIS_URL',
  'CLIENT_URL',
  'API_BASE_URL',
] as const;

const RECOMMENDED_IN_PRODUCTION = [
  'LINKEDIN_CLIENT_ID',
  'LINKEDIN_CLIENT_SECRET',
  'LINKEDIN_REDIRECT_URI',
  'GEMINI_API_KEY',
  'FIREBASE_PROJECT_ID',
  'FIREBASE_CLIENT_EMAIL',
  'FIREBASE_PRIVATE_KEY',
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET',
] as const;

export const validateEnvironment = (): void => {
  const isProduction = process.env.NODE_ENV === 'production';

  if (isProduction) {
    const missing = REQUIRED_IN_PRODUCTION.filter((key) => !process.env[key]);
    if (missing.length > 0) {
      throw new Error(`Missing required environment variables in production: ${missing.join(', ')}`);
    }

    if (!isLinkedInOAuthConfigured()) {
      throw new Error(
        'LinkedIn OAuth is required in production. Set LINKEDIN_CLIENT_ID, LINKEDIN_CLIENT_SECRET, LINKEDIN_REDIRECT_URI'
      );
    }

    if (process.env.ENABLE_MOCK_INTEGRATIONS === 'true') {
      throw new Error('ENABLE_MOCK_INTEGRATIONS must not be true in production');
    }

    const recommended = RECOMMENDED_IN_PRODUCTION.filter((key) => !process.env[key]);
    if (recommended.length > 0) {
      console.warn(`[Config] Missing recommended production variables: ${recommended.join(', ')}`);
    }

    if (!isFirebaseConfigured()) {
      console.warn('[Config] Firebase email not configured — password reset and verification emails may fail');
    }
  } else {
    const warnings: string[] = [];
    if (!process.env.JWT_SECRET) warnings.push('JWT_SECRET');
    if (!process.env.JWT_REFRESH_SECRET) warnings.push('JWT_REFRESH_SECRET');
    if (!process.env.ENCRYPTION_KEY) warnings.push('ENCRYPTION_KEY');
    if (!process.env.REDIS_URL) warnings.push('REDIS_URL (BullMQ will use fallback scheduler)');
    if (warnings.length > 0) {
      console.warn(
        `[Security] Using development fallbacks for: ${warnings.join(', ')}. Set these before production deploy.`
      );
    }
    if (!isLinkedInOAuthConfigured()) {
      console.warn('[Config] LinkedIn OAuth not configured — set ENABLE_MOCK_INTEGRATIONS=true for mock connect in dev');
    }
  }
};
