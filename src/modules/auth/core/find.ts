import { IUserDocument } from '../../../types/types.js';
import User from '../model.js';

export const countAllUsers = async (): Promise<number> => {
  return await User.countDocuments();
};

export const findAllUsersSortedByCreated = async (): Promise<IUserDocument[]> => {
  return await User.find().sort({ createdAt: -1 });
};

export const findUserById = async (id: string): Promise<IUserDocument | null> => {
  return await User.findById(id);
};

export const findUserByIdWithPassword = async (id: string): Promise<IUserDocument | null> => {
  return await User.findById(id).select('+password');
};

export const findUserByEmail = async (email: string): Promise<IUserDocument | null> => {
  return await User.findOne({ email });
};

export const findUserByEmailWithPassword = async (email: string): Promise<IUserDocument | null> => {
  return await User.findOne({ email }).select('+password');
};

export const findUserByGoogleOrEmail = async (googleId: string, email: string): Promise<IUserDocument | null> => {
  return await User.findOne({ $or: [{ googleId }, { email }] });
};

export const findUserByLinkedinOrEmail = async (linkedinId: string, email: string): Promise<IUserDocument | null> => {
  return await User.findOne({ $or: [{ linkedinId }, { email }] });
};
