import mongoose from 'mongoose';
import { ILinkedInAccountDocument } from '../../types/types.js';

const linkedInAccountSchema = new mongoose.Schema<ILinkedInAccountDocument>({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  linkedinId: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  avatar: {
    type: String,
    default: '',
  },
  accessToken: {
    type: String,
    required: true,
  },
  refreshToken: {
    type: String,
    default: '',
  },
  expiresAt: {
    type: Date,
    default: null,
  },
  status: {
    type: String,
    enum: ['active', 'expired', 'disconnected'],
    default: 'active',
  },
}, {
  timestamps: true,
});

linkedInAccountSchema.index({ user: 1, linkedinId: 1 }, { unique: true });

const LinkedInAccount = mongoose.model<ILinkedInAccountDocument>('LinkedInAccount', linkedInAccountSchema);
export default LinkedInAccount;
