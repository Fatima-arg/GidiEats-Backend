import Notification from '../models/Notification';
import { NotificationType } from '../config/constants';

export const createNotification = async (params: {
  userId: number;
  title: string;
  message: string;
  type?: NotificationType;
  orderId?: number;
}) => {
  return Notification.create({
    userId: params.userId,
    title: params.title,
    message: params.message,
    type: params.type ?? 'SYSTEM',
    orderId: params.orderId ?? null
  });
};