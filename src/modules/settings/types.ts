export interface IUpdateProfileRequest {
  name?: string;
  email?: string;
}

export interface IUpdatePasswordRequest {
  currentPassword?: string;
  newPassword?: string;
}

export interface IUpdateBillingPlanRequest {
  plan: 'free' | 'pro' | 'agency';
}
