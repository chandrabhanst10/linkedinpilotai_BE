import { ILinkedInAccountDocument } from '../../../types/types.js';
import LinkedInAccount from '../model.js';

export const createLinkedInAccount = async (
  data: Partial<ILinkedInAccountDocument>
): Promise<ILinkedInAccountDocument> => {
  return await LinkedInAccount.create(data);
};
