import { Response } from 'express';

export const ok = (res: Response, data: unknown, opts?: { message?: string; meta?: unknown }) => {
  const body: Record<string, unknown> = { success: true, data };
  if (opts?.message) body.message = opts.message;
  if (opts?.meta) body.meta = opts.meta;
  res.json(body);
};

export const created = (res: Response, data: unknown, message?: string) =>
  res.status(201).json({ success: true, message, data });

export const noContent = (res: Response) => res.status(204).end();