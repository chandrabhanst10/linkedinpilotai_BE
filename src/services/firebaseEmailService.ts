import admin from 'firebase-admin';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { getErrorMessage } from '../utils/errors.js';

interface MockVerificationPayload extends JwtPayload {
  email: string;
}

const isMockVerificationPayload = (value: JwtPayload | string): value is MockVerificationPayload =>
  typeof value === 'object' &&
  value !== null &&
  'email' in value &&
  typeof value.email === 'string';

const isFirebaseConfigured = (): boolean => {
  return !!(
    process.env.FIREBASE_PROJECT_ID &&
    process.env.FIREBASE_CLIENT_EMAIL &&
    process.env.FIREBASE_PRIVATE_KEY &&
    process.env.FIREBASE_API_KEY
  );
};

let isInitialized = false;

const initFirebase = (): boolean => {
  if (isInitialized) return true;
  if (!isFirebaseConfigured()) return false;

  try {
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
        }),
      });
    }
    isInitialized = true;
    console.log('🔥 Firebase Admin SDK initialized successfully.');
    return true;
  } catch (error: unknown) {
    console.error('❌ Failed to initialize Firebase Admin SDK:', error);
    return false;
  }
};

interface VerificationResult {
  success: boolean;
  mode: 'firebase' | 'mock';
  verificationLink?: string;
}

export const sendVerificationEmail = async (email: string): Promise<VerificationResult> => {
  const firebaseAvailable = initFirebase();

  if (firebaseAvailable) {
    try {
      let firebaseUser: admin.auth.UserRecord;
      try {
        firebaseUser = await admin.auth().getUserByEmail(email);
      } catch (err: unknown) {
        const error = err as { code: string };
        if (error.code === 'auth/user-not-found') {
          firebaseUser = await admin.auth().createUser({
            email,
            emailVerified: false,
          });
        } else {
          throw err;
        }
      }

      const customToken = await admin.auth().createCustomToken(firebaseUser.uid);
      const apiKey = process.env.FIREBASE_API_KEY;

      const signInRes = await fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: customToken, returnSecureToken: true }),
        }
      );

      const signInData = await signInRes.json() as { idToken?: string; error?: { message?: string } };
      if (!signInRes.ok) {
        throw new Error(signInData.error?.message || 'Failed to get Firebase ID token');
      }

      const idToken = signInData.idToken;
      if (!idToken) {
        throw new Error('Firebase ID token not found in response');
      }

      const sendRes = await fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ requestType: 'VERIFY_EMAIL', idToken }),
        }
      );

      const sendData = await sendRes.json() as { error?: { message?: string } };
      if (!sendRes.ok) {
        throw new Error(sendData.error?.message || 'Failed to send verification email');
      }

      console.log(`🔥 Firebase verification email triggered successfully for: ${email}`);
      return { success: true, mode: 'firebase' };
    } catch (error: unknown) {
      console.error('❌ Firebase Email Service error:', error);
      throw error;
    }
  } else {
    // Fallback to Mock Verification Mode
    console.warn('⚠️ Firebase credentials not configured. Falling back to Mock Verification.');

    const mockToken = jwt.sign({ email }, process.env.JWT_SECRET || 'linkpilot_jwt_secret_key_987654321_abcdef', {
      expiresIn: '1d',
    });

    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const verificationLink = `${clientUrl}/verify-email?token=${mockToken}&email=${encodeURIComponent(email)}`;

    console.log('\n==================================================');
    console.log('✉️  MOCK EMAIL VERIFICATION SENT');
    console.log(`To: ${email}`);
    console.log(`Link: ${verificationLink}`);
    console.log('==================================================\n');

    return { success: true, mode: 'mock', verificationLink };
  }
};

export const verifyEmailStatus = async (email: string, token: string | null = null): Promise<boolean> => {
  const firebaseAvailable = initFirebase();

  if (firebaseAvailable) {
    try {
      const firebaseUser = await admin.auth().getUserByEmail(email);
      return firebaseUser.emailVerified;
    } catch (error: unknown) {
      console.error('❌ Error checking Firebase email status:', error);
      return false;
    }
  } else {
    if (!token) return false;

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'linkpilot_jwt_secret_key_987654321_abcdef');
      return isMockVerificationPayload(decoded) && decoded.email === email;
    } catch (error: unknown) {
      console.error('❌ Mock verification token failed:', getErrorMessage(error));
      return false;
    }
  }
};
