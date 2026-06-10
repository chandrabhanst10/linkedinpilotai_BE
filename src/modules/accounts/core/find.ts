import mongoose from 'mongoose';
import { ILinkedInAccountDocument } from '../../../types/types.js';
import LinkedInAccount from '../model.js';

export const findLinkedInAccountById = async (id: string): Promise<ILinkedInAccountDocument | null> => {
  return await LinkedInAccount.findById(id);
};

export const findLinkedInAccountsByUserId = async (userId: string): Promise<ILinkedInAccountDocument[]> => {
  return await LinkedInAccount.find({ user: new mongoose.Types.ObjectId(userId) });
};

export const findLinkedInAccountByUserAndId = async (
  id: string,
  userId: string
): Promise<ILinkedInAccountDocument | null> => {
  return await LinkedInAccount.findOne({
    _id: new mongoose.Types.ObjectId(id),
    user: new mongoose.Types.ObjectId(userId),
  });
};

export const findLinkedInAccountByUserAndLinkedinId = async (
  userId: string,
  linkedinId: string
): Promise<ILinkedInAccountDocument | null> => {
  return await LinkedInAccount.findOne({
    user: new mongoose.Types.ObjectId(userId),
    linkedinId
  });
};
