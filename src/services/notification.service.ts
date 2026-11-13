import { Op, WhereOptions } from 'sequelize';
import Notification from '../models/Notification';
import { ApiError } from '../utils/ApiError';
import { getPagination, buildPageMeta } from '../utils/pagination';

export const listNotifications = async (userId: number, query: { page?: number; limit?: number; unread?: string }) => {
  const { page, limit, offset } = getPagination(query.page, query.limit);
  const where: WhereOptions = { userId };
  if (query.unread === 'true') where.isRead = false;

  const { count, rows } = await Notification.findAndCountAll({
    where,
    limit,
    offset,
    order: [['createdAt', 'DESC']]
  });
  return { data: rows, meta: buildPageMeta(count, page, limit), unreadCount: await Notification.count({ where: { userId, isRead: false } }) };
};

export const markNotificationRead = async (userId: number, id: number) => {
  const notification = await Notification.findOne({ where: { id, userId } });
  if (!notification) throw ApiError.notFound('Notification not found');
  await notification.update({ isRead: true });
  return notification;
};

export const markAllNotificationsRead = async (userId: number) => {
  await Notification.update({ isRead: true }, { where: { userId } });
  return { updated: true };
};

export const unreadNotificationCount = async (userId: number) => {
  return Notification.count({ where: { userId, isRead: false } });
};