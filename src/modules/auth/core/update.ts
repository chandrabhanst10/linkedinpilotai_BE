import { IUserDocument } from '../../../types/types.js';
import User from '../model.js';

export const updateUser = async (
  id: string,
  data: Partial<IUserDocument>
): Promise<IUserDocument | null> => {
  return await User.findByIdAndUpdate(id, data, { new: true });
};
