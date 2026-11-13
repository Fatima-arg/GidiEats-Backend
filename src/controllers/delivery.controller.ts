import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { ok } from '../utils/response';
import * as deliveryService from '../services/delivery.service';
import { ApiError } from '../utils/ApiError';
import { ROLES } from '../config/constants';
import { Delivery, Rider, Order, Restaurant, Customer, OrderItem } from '../models';

const getDeliveryForScope = async (req: Request, id: number) => {
  const delivery = await Delivery.findByPk(id);
  if (!delivery) throw ApiError.notFound('Delivery not found');

  if (req.user!.role === ROLES.RIDER) {
    const rider = await Rider.findOne({ where: { userId: req.user!.id } });
    if (!rider || delivery.riderId !== rider.id) {
      throw ApiError.forbidden('This delivery is not assigned to you');
    }
  } else if (req.user!.role === ROLES.RESTAFF) {
    const { RestaurantStaff } = await import('../models');
    const staff = await RestaurantStaff.findOne({ where: { userId: req.user!.id } });
    const order = await Order.findByPk(delivery.orderId);
    if (!staff || !order || order.restaurantId !== staff.restaurantId) {
      throw ApiError.forbidden('This delivery does not belong to your restaurant');
    }
  }
  return delivery;
};

export const listDeliveries = asyncHandler(async (req: Request, res: Response) => {
  const result = await deliveryService.listDeliveries(req.query, {
    role: req.user!.role,
    userId: req.user!.id
  });
  ok(res, result.data, { meta: result.meta });
});

export const getDelivery = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as unknown as { id: number };
  const delivery = await getDeliveryForScope(req, id);
  const detail = await Delivery.findByPk(delivery.id, {
    include: [
      {
        model: Order,
        as: 'order',
        include: [
          { model: Restaurant, as: 'restaurant', attributes: ['id', 'name', 'phone', 'addressStreet', 'addressCity'] },
          { model: Customer, as: 'customer', attributes: ['id'] },
          { model: OrderItem, as: 'items' }
        ]
      },
      { model: Rider, as: 'rider' }
    ]
  });
  ok(res, detail);
});

export const updateDeliveryStatus = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as unknown as { id: number };
  const delivery = await getDeliveryForScope(req, id);
  const updated = await deliveryService.updateDeliveryStatus(delivery.id, req.body.status, req.body.note);
  ok(res, updated, { message: 'Delivery status updated' });
});