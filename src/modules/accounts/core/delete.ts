import mongoose from 'mongoose';
import { ILinkedInAccountDocument } from '../../../types/types.js';
import LinkedInAccount from '../model.js';

export const deleteLinkedInAccountByUserAndId = async (
  id: string,
  userId: string
): Promise<ILinkedInAccountDocument | null> => {
  return await LinkedInAccount.findOneAndDelete({
    _id: new mongoose.Types.ObjectId(id),
    user: new mongoose.Types.ObjectId(userId)
  });
};
