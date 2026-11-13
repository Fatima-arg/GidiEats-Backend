import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { ok } from '../utils/response';
import * as notificationService from '../services/notification.service';

export const listNotifications = asyncHandler(async (req: Request, res: Response) => {
  const result = await notificationService.listNotifications(req.user!.id, req.query);
  ok(res, result.data, { message: `Unread: ${result.unreadCount}`, meta: { ...result.meta, unreadCount: result.unreadCount } });
});

export const markRead = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as unknown as { id: number };
  ok(res, await notificationService.markNotificationRead(req.user!.id, id));
});

export const markAllRead = asyncHandler(async (req: Request, res: Response) => {
  ok(res, await notificationService.markAllNotificationsRead(req.user!.id));
});

export const unreadCount = asyncHandler(async (req: Request, res: Response) => {
  ok(res, { count: await notificationService.unreadNotificationCount(req.user!.id) });
});