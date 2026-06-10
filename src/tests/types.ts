import type { Request, Response, NextFunction } from 'express';

export interface IMockReq {
  body: Record<string, unknown>;
  query: Record<string, unknown>;
  params: Record<string, string>;
  user: { _id: string; id?: string; name?: string; role?: string; email?: string } | null;
  headers: Record<string, string>;
}

export interface IMockRes {
  statusCode: number;
  jsonData: Record<string, unknown> | null;
  status: (code: number) => IMockRes;
  json: (data: Record<string, unknown> | null) => IMockRes;
}

export const createMockReq = (options: Partial<IMockReq> = {}): IMockReq => ({
  body: {},
  query: {},
  params: {},
  user: null,
  headers: {},
  ...options,
});

export const createMockRes = (): IMockRes => {
  const res = {} as IMockRes;
  res.statusCode = 200;
  res.jsonData = null;
  res.status = (code: number) => {
    res.statusCode = code;
    return res;
  };
  res.json = (data: Record<string, unknown> | null) => {
    res.jsonData = data;
    return res;
  };
  return res;
};

/** Test-only bridge: IMockReq satisfies the subset of Express Request used by handlers. */
export const asHandlerReq = (req: IMockReq): Request => req as unknown as Request;

/** Test-only bridge: IMockRes satisfies the subset of Express Response used by handlers. */
export const asHandlerRes = (res: IMockRes): Response => res as unknown as Response;
export const testNext: NextFunction = (err?: unknown): void => {
  if (err) {
    throw err;
  }
};
