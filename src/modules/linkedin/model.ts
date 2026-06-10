import mongoose from 'mongoose';
import { ILinkedInConnectionDocument } from '../../types/types.js';

const linkedInConnectionSchema = new mongoose.Schema<ILinkedInConnectionDocument>({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  linkedinId: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
  },
  accessToken: {
    type: String,
    required: true,
  },
  expiresAt: {
    type: Date,
  },
  connectedAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

const LinkedInConnection = mongoose.model<ILinkedInConnectionDocument>('LinkedInConnection', linkedInConnectionSchema);
export default LinkedInConnection;
