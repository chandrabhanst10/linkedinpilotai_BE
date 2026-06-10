import { IWorkspaceDocument, ISubscriptionDocument } from '../../../types/types.js';
import { Workspace, Subscription } from '../model.js';

export const createWorkspace = async (
  data: Partial<IWorkspaceDocument>
): Promise<IWorkspaceDocument> => {
  return await Workspace.create(data);
};

export const createSubscription = async (
  data: Partial<ISubscriptionDocument>
): Promise<ISubscriptionDocument> => {
  return await Subscription.create(data);
};
