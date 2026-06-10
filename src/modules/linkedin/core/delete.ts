import mongoose from 'mongoose';
import { ILinkedInConnectionDocument } from '../../../types/types.js';
import LinkedInConnection from '../model.js';

export const deleteLinkedInConnectionByUserId = async (userId: string): Promise<ILinkedInConnectionDocument | null> => {
  return await LinkedInConnection.findOneAndDelete({ userId: new mongoose.Types.ObjectId(userId) });
};
