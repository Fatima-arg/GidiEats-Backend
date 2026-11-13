import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/ApiError';

export const errorHandler = (
  err: unknown,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
) => {
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      code: err.code,
      details: err.details
    });
  }

  if (err instanceof Error) {
    const dbError = err as unknown as { parent?: { code?: string } };
    if (dbError?.parent?.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        success: false,
        message: 'A record with the same unique value already exists',
        code: 'DUPLICATE'
      });
    }
    console.error('[ERROR]', req.method, req.originalUrl, err);
    return res.status(500).json({
      success: false,
      message: 'An unexpected server error occurred',
      code: 'INTERNAL'
    });
  }

  return res.status(500).json({ success: false, message: 'Unknown error', code: 'INTERNAL' });
};

export const notFoundHandler = (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
    code: 'ROUTE_NOT_FOUND'
  });
};