import { Request, Response, NextFunction } from 'express';
import { ApiError } from './ApiError.js';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  let { statusCode, message } = err;

  if (!(err instanceof ApiError)) {
    statusCode = err.statusCode || err.status || 500;
    message = err.message || "Internal Server Error";
    err = new ApiError(statusCode, message, [], err.stack);
  }

  const response = {
    ...err,
    message,
    ...(process.env.NODE_ENV === "development" ? { stack: err.stack } : {}),
  };

  return res.status(statusCode).json(response);
};
