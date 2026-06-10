import { Request, Response, NextFunction } from 'express';
import * as accountsService from './service.js';
import { userIdToObjectId } from '../../utils/objectId.js';
import { getParam } from '../../utils/params.js';

export const getAccounts = async (req: Request, res: Response, next: NextFunction): Promise<void | Response> => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }
    const accounts = await accountsService.getUserAccounts(String(req.user._id));
    return res.status(200).json({ success: true, data: accounts });
  } catch (error: unknown) {
    next(error);
  }
};

export const connectAccount = async (req: Request, res: Response, next: NextFunction): Promise<void | Response> => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }
    const { linkedinId, name, avatar } = req.body;
    const account = await accountsService.connectLinkedInAccount(
      String(req.user._id),
      userIdToObjectId(req.user),
      linkedinId,
      name,
      avatar
    );
    return res.status(200).json({ success: true, data: account });
  } catch (error: unknown) {
    next(error);
  }
};

export const disconnectAccount = async (req: Request, res: Response, next: NextFunction): Promise<void | Response> => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }
    const account = await accountsService.disconnectLinkedInAccount(getParam(req.params, 'id'), String(req.user._id));

    if (!account) {
      return res.status(404).json({ success: false, message: 'Connected account not found' });
    }

    return res.status(200).json({ success: true, message: 'Account disconnected successfully' });
  } catch (error: unknown) {
    next(error);
  }
};
