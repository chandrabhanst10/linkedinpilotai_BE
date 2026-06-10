import mongoose, { Types } from 'mongoose';

/** Normalize string or ObjectId values for Mongoose document fields. */
export const toObjectId = (id: string | Types.ObjectId): Types.ObjectId =>
  id instanceof Types.ObjectId ? id : new mongoose.Types.ObjectId(id);

/** Extract ObjectId from an authenticated user document. */
export const userIdToObjectId = (user: { _id: Types.ObjectId | string }): Types.ObjectId =>
  toObjectId(user._id);
