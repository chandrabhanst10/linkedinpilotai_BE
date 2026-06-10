export interface IGentPostRequest {
  topic: string;
  tone?: string;
}

export interface IImprovePostRequest {
  content: string;
  action: 'shorten' | 'expand' | 'improve';
}

export interface IGenerateCTARequest {
  tone?: string;
}
