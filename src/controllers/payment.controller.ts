import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { ok, created } from '../utils/response';
import * as paymentService from '../services/payment.service';
import { ApiError } from '../utils/ApiError';
import { ROLES } from '../config/constants';
import { Customer, Order } from '../models';

const ensureOwnOrder = async (req: Request, orderId: number) => {
  if (req.user!.role !== ROLES.CUSTOMER) return;
  const customer = await Customer.findOne({ where: { userId: req.user!.id } });
  const order = await Order.findByPk(orderId);
  if (!order || !customer || order.customerId !== customer.id) {
    throw ApiError.forbidden('This order does not belong to you');
  }
};

export const processGuestPayment = asyncHandler(async (req: Request, res: Response) => {
  const { orderId } = req.params as unknown as { orderId: number };
  const { Order } = await import('../models');
  const order = await Order.findByPk(orderId);
  if (!order) throw ApiError.notFound('Order not found');
  if (order.customerId !== null) {
    throw ApiError.forbidden('Please log in to pay for this order');
  }
  let snapshot: { phone?: string } | null = null;
  try {
    snapshot = order.deliveryAddress ? JSON.parse(order.deliveryAddress) : null;
  } catch {
    snapshot = null;
  }
  if (!snapshot || String(snapshot.phone).trim() !== String(req.body.phone).trim()) {
    throw ApiError.forbidden('Phone number does not match this order');
  }
  const payment = await paymentService.processPayment(orderId, req.body);
  ok(res, payment, { message: 'Payment successful' });
});

export const processOrderPayment = asyncHandler(async (req: Request, res: Response) => {
  const { orderId } = req.params as unknown as { orderId: number };
  await ensureOwnOrder(req, orderId);
  const payment = await paymentService.processPayment(orderId, req.body);
  ok(res, payment, { message: 'Payment successful' });
});

export const initiateFlutterwave = asyncHandler(async (req: Request, res: Response) => {
  const result = await paymentService.initiateFlutterwavePayment(
    req.body,
    req.user ? { role: req.user.role, userId: req.user.id } : null
  );
  ok(res, result, { message: 'Flutterwave payment initiated' });
});

export const verifyFlutterwave = asyncHandler(async (req: Request, res: Response) => {
  const payment = await paymentService.verifyFlutterwavePayment(
    req.body,
    req.user ? { role: req.user.role, userId: req.user.id } : null
  );
  ok(res, payment, { message: 'Payment verified successfully' });
});

export const flutterwaveWebhook = asyncHandler(async (req: Request, res: Response) => {
  const signature = req.headers['verif-hash'] as string | undefined;
  const result = await paymentService.handleFlutterwaveWebhook(req.body, signature);
  ok(res, result);
});

export const paymentForOrder = asyncHandler(async (req: Request, res: Response) => {
  const { orderId } = req.params as unknown as { orderId: number };
  await ensureOwnOrder(req, orderId);
  ok(res, await paymentService.getPaymentByOrder(orderId));
});

export const listPayments = asyncHandler(async (req: Request, res: Response) => {
  const result = await paymentService.listPayments(req.query, {
    role: req.user!.role,
    userId: req.user!.id
  });
  ok(res, result.data, { meta: result.meta });
});

export const getPayment = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as unknown as { id: number };
  const { Payment } = await import('../models');
  const payment = await Payment.findByPk(id, {
    include: [{ model: Order, as: 'order', attributes: ['id', 'orderNumber', 'total', 'status'] }]
  });
  if (!payment) throw ApiError.notFound('Payment not found');
  ok(res, payment);
});
