import { Request, Response, NextFunction } from 'express';
import { isHttpError } from '../utils/httpError.js';

export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction): void => {
  const statusCode = isHttpError(err)
    ? err.statusCode
    : res.statusCode === 200
      ? 500
      : res.statusCode;
  
  console.error('Error occurred:', {
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? '🥞' : err.stack,
    path: req.originalUrl,
    method: req.method
  });

  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
};

export const notFound = (req: Request, res: Response, next: NextFunction): void => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};
