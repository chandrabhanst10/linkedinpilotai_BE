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
  sub: string; // The Member ID
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

  const data = await response.json() as ILinkedInTokenResponse;
  if (!response.ok) {
    throw new Error(data.error_description || data.error || 'Failed to exchange LinkedIn authorization code.');
  }

  return data;
};

export const getLinkedInProfile = async (accessToken: string): Promise<ILinkedInProfileResponse> => {
  const response = await fetch('https://api.linkedin.com/v2/userinfo', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  const data = await response.json() as ILinkedInProfileResponse;
  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch LinkedIn profile details.');
  }

  return data;
};

export const createPost = async ({
  accessToken,
  linkedinMemberId,
  text
}: ICreatePostParams): Promise<ICreatePostResult> => {
  const authorUrn = linkedinMemberId.startsWith('urn:li:') 
    ? linkedinMemberId 
    : `urn:li:person:${linkedinMemberId}`;

  const response = await fetch('https://api.linkedin.com/v2/posts', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
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
      const errData = await response.json() as { message?: string; error?: string };
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
