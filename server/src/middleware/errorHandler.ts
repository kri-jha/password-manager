import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';
import { env } from '../config/env.js';

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Operational errors
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      errors: err.errors
    });
    return;
  }

  // MongoDB duplicate key error (code 11000)
  if (err && err.code === 11000) {
    const keys = Object.keys(err.keyPattern || {});
    const field = keys.length > 0 ? keys[0] : 'field';
    res.status(409).json({
      success: false,
      message: `A record with this ${field} already exists.`
    });
    return;
  }

  // MongoDB Invalid ObjectId CastError
  if (err && err.name === 'CastError') {
    res.status(400).json({
      success: false,
      message: `Invalid ID format for parameter: ${err.path}`
    });
    return;
  }

  // Unhandled / server errors
  logger.error(`Unhandled Exception on ${req.method} ${req.originalUrl}`, err);

  const isProduction = env.NODE_ENV === 'production';
  res.status(500).json({
    success: false,
    message: isProduction ? 'An unexpected internal server error occurred.' : err.message || 'Internal Server Error',
    ...(isProduction ? {} : { stack: err.stack })
  });
}
