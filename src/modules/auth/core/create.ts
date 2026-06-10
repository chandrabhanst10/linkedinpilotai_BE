import { IUserDocument } from '../../../types/types.js';
import User from '../model.js';

export const createUser = async (data: {
  name: string;
  email: string;
  password?: string;
  googleId?: string | null;
  linkedinId?: string | null;
  isVerified?: boolean;
}): Promise<IUserDocument> => {
  return await User.create(data);
};
