/**
 * Error handling middleware
 */
import { Request, Response, NextFunction } from 'express';

/**
 * Custom API error class
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code: string = 'INTERNAL_ERROR'
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Common error types
 */
export const Errors = {
  badRequest: (message: string) => new ApiError(message, 400, 'BAD_REQUEST'),
  notFound: (message: string) => new ApiError(message, 404, 'NOT_FOUND'),
  validation: (message: string) => new ApiError(message, 422, 'VALIDATION_ERROR'),
  internal: (message: string) => new ApiError(message, 500, 'INTERNAL_ERROR'),
  crawlFailed: (message: string) => new ApiError(message, 502, 'CRAWL_FAILED'),
  aiError: (message: string) => new ApiError(message, 503, 'AI_ERROR'),
};

/**
 * Error response format
 */
interface ErrorResponse {
  success: false;
  error: {
    message: string;
    code: string;
    statusCode: number;
  };
}

/**
 * Global error handler middleware
 */
export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.error('Error:', err);

  if (err instanceof ApiError) {
    const response: ErrorResponse = {
      success: false,
      error: {
        message: err.message,
        code: err.code,
        statusCode: err.statusCode,
      },
    };
    res.status(err.statusCode).json(response);
    return;
  }

  // Handle unexpected errors
  const response: ErrorResponse = {
    success: false,
    error: {
      message: 'An unexpected error occurred',
      code: 'INTERNAL_ERROR',
      statusCode: 500,
    },
  };
  res.status(500).json(response);
}

/**
 * Async handler wrapper to catch async errors
 */
export function asyncHandler<T>(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<T>
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
