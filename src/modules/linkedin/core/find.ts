import mongoose from 'mongoose';
import { ILinkedInConnectionDocument } from '../../../types/types.js';
import LinkedInConnection from '../model.js';

export const getLinkedInConnectionByUserId = async (userId: string): Promise<ILinkedInConnectionDocument | null> => {
  return await LinkedInConnection.findOne({ userId: new mongoose.Types.ObjectId(userId) });
};
