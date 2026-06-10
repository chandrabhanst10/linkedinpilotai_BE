import { IUserDocument } from '../../../types/types.js';
import User from '../model.js';

export const deleteUserById = async (id: string): Promise<IUserDocument | null> => {
  return await User.findByIdAndDelete(id);
};
