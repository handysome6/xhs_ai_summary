/**
 * Request logging middleware
 */
import { Request, Response, NextFunction } from 'express';

/**
 * Log request details
 */
export function requestLogger(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const start = Date.now();

  // Log when response finishes
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logLine = [
      `[${new Date().toISOString()}]`,
      req.method,
      req.path,
      res.statusCode,
      `${duration}ms`,
    ].join(' ');

    if (res.statusCode >= 400) {
      console.error(logLine);
    } else {
      console.log(logLine);
    }
  });

  next();
}
