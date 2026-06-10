import * as linkedinCore from './core/index.js';
import * as accountsCore from '../accounts/core/index.js';
import { encrypt } from '../../utils/encryption.js';
import { toObjectId } from '../../utils/objectId.js';
import { ILinkedInConnectionDocument } from '../../types/types.js';

export interface ILinkedInTokenResponse {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  refresh_token_expires_in?: number;
  scope: string;
  error?: string;
  error_description?: string;
}

export interface ILinkedInProfileResponse {
  sub: string;
  name: string;
  given_name: string;
  family_name: string;
  picture?: string;
  locale: {
    country: string;
    language: string;
  };
  email: string;
  email_verified: boolean;
  message?: string;
}

export interface ICreatePostParams {
  accessToken: string;
  linkedinMemberId: string;
  text: string;
}

export interface ICreatePostResult {
  success: boolean;
  urn: string;
}

export const exchangeCodeForToken = async (code: string): Promise<ILinkedInTokenResponse> => {
  const clientId = process.env.LINKEDIN_CLIENT_ID;
  const clientSecret = process.env.LINKEDIN_CLIENT_SECRET;
  const redirectUri = process.env.LINKEDIN_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error('LinkedIn configuration credentials are missing in env.');
  }

  const response = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });

  const data = (await response.json()) as ILinkedInTokenResponse;
  if (!response.ok) {
    throw new Error(data.error_description || data.error || 'Failed to exchange LinkedIn authorization code.');
  }

  return data;
};

export const getLinkedInProfile = async (accessToken: string): Promise<ILinkedInProfileResponse> => {
  const response = await fetch('https://api.linkedin.com/v2/userinfo', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const data = (await response.json()) as ILinkedInProfileResponse;
  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch LinkedIn profile details.');
  }

  return data;
};

export const createPost = async ({
  accessToken,
  linkedinMemberId,
  text,
}: ICreatePostParams): Promise<ICreatePostResult> => {
  const authorUrn = linkedinMemberId.startsWith('urn:li:') 
    ? linkedinMemberId 
    : `urn:li:person:${linkedinMemberId}`;

  const response = await fetch('https://api.linkedin.com/v2/posts', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'X-Restli-Protocol-Version': '2.0.0',
    },
    body: JSON.stringify({
      author: authorUrn,
      commentary: text,
      visibility: 'PUBLIC',
      distribution: {
        feedDistribution: 'MAIN_FEED',
        targetEntities: [],
        thirdPartyDistributionChannels: [],
      },
      lifecycleState: 'PUBLISHED',
    }),
  });

  if (!response.ok) {
    let errMsg = 'Failed to publish post to LinkedIn REST API.';
    try {
      const errData = (await response.json()) as { message?: string; error?: string };
      errMsg = errData.message || errData.error || errMsg;
    } catch (_) {}
    throw new Error(errMsg);
  }

  const postUrn = response.headers.get('x-restli-id') || response.headers.get('location') || '';
  return {
    success: true,
    urn: postUrn,
  };
};

export const connectConnection = async (userId: string, code: string): Promise<ILinkedInConnectionDocument | null> => {
  const tokenData = await exchangeCodeForToken(code);
  const accessToken = tokenData.access_token;
  const expiresAt = tokenData.expires_in 
    ? new Date(Date.now() + tokenData.expires_in * 1000) 
    : new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);

  const profile = await getLinkedInProfile(accessToken);
  const linkedinId = profile.sub;
  const name = profile.name || `${profile.given_name || ''} ${profile.family_name || ''}`.trim() || 'LinkedIn Member';
  const email = profile.email;

  const encryptedToken = encrypt(accessToken);

  const connection = await linkedinCore.saveLinkedInConnection({
    userId,
    linkedinId,
    name,
    email,
    accessToken: encryptedToken,
    expiresAt,
  });

  let account = await accountsCore.findLinkedInAccountByUserAndLinkedinId(userId, linkedinId);
  if (account) {
    account.name = name;
    account.avatar = profile.picture || account.avatar;
    account.accessToken = encryptedToken;
    account.status = 'active';
    account.expiresAt = expiresAt;
    await account.save();
  } else {
    await accountsCore.createLinkedInAccount({
      user: toObjectId(userId),
      linkedinId,
      name,
      avatar: profile.picture || '',
      accessToken: encryptedToken,
      refreshToken: '',
      status: 'active',
      expiresAt,
    });
  }

  return connection;
};

export const getConnectionByUserId = async (userId: string): Promise<ILinkedInConnectionDocument | null> => {
  return await linkedinCore.getLinkedInConnectionByUserId(userId);
};

export const removeConnectionByUserId = async (userId: string): Promise<ILinkedInConnectionDocument | null> => {
  const connection = await linkedinCore.deleteLinkedInConnectionByUserId(userId);
  if (connection) {
    const accounts = await accountsCore.findLinkedInAccountsByUserId(userId);
    for (const account of accounts) {
      if (account.linkedinId === connection.linkedinId) {
        await accountsCore.deleteLinkedInAccountByUserAndId(String(account._id), userId);
      }
    }
  }
  return connection;
};
