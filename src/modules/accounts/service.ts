import { Types } from 'mongoose';
import { ILinkedInAccountDocument } from '../../types/types.js';
import { HttpError } from '../../utils/httpError.js';
import { isLinkedInOAuthConfigured, isMockIntegrationsEnabled } from '../../config/integrations.js';
import * as accountsCore from './core/index.js';
import { encrypt } from '../../utils/encryption.js';

export const getUserAccounts = async (userId: string): Promise<ILinkedInAccountDocument[]> => {
  return await accountsCore.findLinkedInAccountsByUserId(userId);
};

export const connectLinkedInAccount = async (
  userId: string,
  userObjectId: Types.ObjectId,
  linkedinId?: string,
  name?: string,
  avatar?: string
): Promise<ILinkedInAccountDocument> => {
  const isProduction = process.env.NODE_ENV === 'production';

  if (isProduction || !isMockIntegrationsEnabled()) {
    if (!isLinkedInOAuthConfigured()) {
      throw new HttpError(
        503,
        'LinkedIn OAuth is not configured. Set LINKEDIN_CLIENT_ID, LINKEDIN_CLIENT_SECRET, and LINKEDIN_REDIRECT_URI.'
      );
    }
    throw new HttpError(
      403,
      'Mock account connect is disabled. Use GET /api/linkedin/auth to connect via LinkedIn OAuth.'
    );
  }

  const mockId = linkedinId || `li_${Math.random().toString(36).substring(2, 9)}`;
  const mockName = name || 'John Doe (Pilot)';
  const mockAvatar = avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face';
  const encryptedToken = encrypt(`mock_oauth_token_${Math.random().toString(36).substring(2, 12)}`);

  let account = await accountsCore.findLinkedInAccountByUserAndLinkedinId(userId, mockId);

  if (account) {
    account.name = mockName;
    account.avatar = mockAvatar;
    account.accessToken = encryptedToken;
    account.status = 'active';
    account.expiresAt = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);
    await account.save();
  } else {
    account = await accountsCore.createLinkedInAccount({
      user: userObjectId,
      linkedinId: mockId,
      name: mockName,
      avatar: mockAvatar,
      accessToken: encryptedToken,
      status: 'active',
      expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
    });
  }

  return account;
};

export const disconnectLinkedInAccount = async (
  id: string,
  userId: string
): Promise<ILinkedInAccountDocument | null> => {
  return await accountsCore.deleteLinkedInAccountByUserAndId(id, userId);
};
