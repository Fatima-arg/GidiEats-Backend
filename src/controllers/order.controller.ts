import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { ok, created } from '../utils/response';
import * as orderService from '../services/order.service';
import { ROLES } from '../config/constants';

export const createOrder = asyncHandler(async (req: Request, res: Response) => {
  const order = await orderService.createOrder({
    customerId: req.user?.id ?? null,
    restaurantId: req.body.restaurantId,
    items: req.body.items,
    addressId: req.body.addressId,
    deliveryAddress: req.body.deliveryAddress,
    paymentMethod: req.body.paymentMethod,
    specialInstructions: req.body.specialInstructions
  });
  created(res, order, 'Order created');
});

export const trackOrder = asyncHandler(async (req: Request, res: Response) => {
  const order = await orderService.trackOrder(req.body.orderNumber, req.body.phone);
  ok(res, order);
});

export const trackOrderByNumber = asyncHandler(async (req: Request, res: Response) => {
  const { orderNumber } = req.params as unknown as { orderNumber: string };
  const order = await orderService.trackOrder(orderNumber);
  ok(res, order);
});

export const guestOrderHistory = asyncHandler(async (req: Request, res: Response) => {
  const orders = await orderService.guestOrderHistory(req.body.phone);
  ok(res, orders);
});

export const confirmReceipt = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as unknown as { id: number };
  const order = await orderService.confirmReceipt(
    id,
    req.user ? { role: req.user.role, userId: req.user.id } : null,
    req.body.phone
  );
  ok(res, order);
});

export const rateOrder = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as unknown as { id: number };
  const order = await orderService.rateOrder(
    id,
    {
      rating: req.body.rating,
      deliveryRating: req.body.deliveryRating,
      comment: req.body.comment
    },
    { role: req.user!.role, userId: req.user!.id }
  );
  ok(res, order);
});

export const listOrders = asyncHandler(async (req: Request, res: Response) => {
  const result = await orderService.listOrders(req.query as orderService.OrderQuery, {
    role: req.user!.role,
    userId: req.user!.id
  });
  ok(res, result.data, { meta: result.meta });
});

export const getOrder = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as unknown as { id: number };
  const order = await orderService.getOrderById(id, req.user!.role);

  // enforce ownership for customers on direct id fetch
  if (req.user!.role === ROLES.CUSTOMER) {
    const { Customer } = await import('../models');
    const customer = await Customer.findOne({ where: { userId: req.user!.id } });
    if (!customer || order.customerId !== customer.id) {
      const { ApiError } = await import('../utils/ApiError');
      throw ApiError.notFound('Order not found');
    }
  }
  ok(res, order);
});

export const updateOrderStatus = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as unknown as { id: number };
  const order = await orderService.updateOrderStatus(
    id,
    req.body.status,
    { role: req.user!.role, userId: req.user!.id },
    req.body.reason
  );
  ok(res, order, { message: 'Order status updated' });
});

export const cancelOrder = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as unknown as { id: number };
  const order = await orderService.cancelOrder(id, req.user!.id, req.body.reason);
  ok(res, order, { message: 'Order cancelled' });
});

export const assignRider = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as unknown as { id: number };
  const order = await orderService.assignRider(
    id,
    req.body.riderId,
    { role: req.user!.role, userId: req.user!.id }
  );
  ok(res, order, { message: 'Rider assigned' });
});

export const claimDelivery = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as unknown as { id: number };
  const order = await orderService.claimDelivery(id, req.user!.id);
  ok(res, order, { message: 'Delivery claimed and assigned' });
});