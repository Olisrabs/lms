import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import logger from '../utils/logger';

/**
 * Validates express-validator result and short-circuits with 400 if errors exist.
 */
export function validate(req: Request, res: Response, next: NextFunction): void {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({
      error: 'Validation failed',
      details: errors.array().map((e) => ({ field: e.type, message: e.msg })),
    });
    return;
  }
  next();
}

/**
 * Global error handler — catches unhandled errors thrown in routes/middleware.
 * Sanitizes stack traces in production.
 */
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void {
  logger.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  const status = (err as NodeJS.ErrnoException & { status?: number }).status || 500;

  res.status(status).json({
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
  });
}

/**
 * 404 handler for unknown routes.
 */
export function notFound(req: Request, res: Response): void {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found` });
}

/**
 * Request logger middleware (dev only; Morgan handles production logging).
 */
export function requestLogger(req: Request, _res: Response, next: NextFunction): void {
  logger.debug(`${req.method} ${req.path}`, { ip: req.ip, user: req.user?.sub });
  next();
}
