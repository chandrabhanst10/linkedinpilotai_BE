import { ILinkedInAccountDocument } from '../../../types/types.js';
import LinkedInAccount from '../model.js';

export const updateLinkedInAccount = async (
  id: string,
  data: Partial<ILinkedInAccountDocument>
): Promise<ILinkedInAccountDocument | null> => {
  return await LinkedInAccount.findByIdAndUpdate(id, data, { new: true });
};
