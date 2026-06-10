import { IMedia } from '../../types/types.js';

export interface ISchedulePostRequest {
  content: string;
  media?: IMedia[];
  scheduledTime: string;
  status?: string;
  linkedinAccounts: string[];
}
