import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
import { ApiError } from '../utils/ApiError';

type Source = 'body' | 'query' | 'params';

export const validate = (schema: ZodSchema, source: Source = 'body') =>
  (req: Request, _res: Response, next: NextFunction) => {
    const input = source === 'body' ? req.body : source === 'query' ? req.query : req.params;
    const result = schema.safeParse(input);
    if (!result.success) {
      const details = result.error.issues.map((i) => ({
        field: i.path.join('.'),
        message: i.message
      }));
      return next(ApiError.unprocessable('Validation failed', details));
    }
    if (source === 'body') req.body = result.data;
    else if (source === 'query') req.query = result.data as Request['query'];
    else req.params = result.data as Request['params'];
    next();
  };