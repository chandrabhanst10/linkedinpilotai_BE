import mongoose from 'mongoose';
import { ILinkedInConnectionDocument } from '../../../types/types.js';
import LinkedInConnection from '../model.js';

export const saveLinkedInConnection = async ({
  userId,
  linkedinId,
  name,
  email,
  accessToken,
  expiresAt
}: {
  userId: string;
  linkedinId: string;
  name: string;
  email?: string;
  accessToken: string;
  expiresAt?: Date;
}): Promise<ILinkedInConnectionDocument | null> => {
  return await LinkedInConnection.findOneAndUpdate(
    { userId: new mongoose.Types.ObjectId(userId) },
    {
      linkedinId,
      name,
      email,
      accessToken,
      expiresAt,
      connectedAt: new Date(),
    },
    { upsert: true, new: true }
  );
};
