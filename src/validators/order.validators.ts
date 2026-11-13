import { z } from 'zod';
import { paginationQuerySchema } from './restaurant.validators';
import { ORDER_STATUSES, PAYMENT_METHODS, DELIVERY_STATUSES } from '../config/constants';

export const idParamsSchema = z.object({ id: z.coerce.number().int().positive() });
export const orderIdParamsSchema = z.object({ orderId: z.coerce.number().int().positive() });
export const orderNumberParamsSchema = z.object({ orderNumber: z.string().trim().min(4).max(30) });

export const trackOrderSchema = z.object({
  orderNumber: z.string().trim().min(4).max(30),
  phone: z.string().trim().min(6).max(20).optional()
});

export const guestHistorySchema = z.object({
  phone: z.string().trim().min(6).max(20)
});

export const createOrderItemSchema = z.object({
  foodItemId: z.number().int().positive(),
  quantity: z.number().int().min(1).max(99)
});

export const createOrderSchema = z.object({
  restaurantId: z.number().int().positive(),
  items: z.array(createOrderItemSchema).min(1, 'Order must contain at least one item').max(50),
  addressId: z.number().int().positive().optional(),
  deliveryAddress: z
    .object({
      name: z.string().trim().min(2).max(100),
      phone: z.string().trim().min(6).max(20),
      street: z.string().trim().min(3).max(160),
      city: z.string().trim().min(2).max(80),
      state: z.string().trim().min(2).max(50)
    })
    .optional(),
  paymentMethod: z.enum(Object.values(PAYMENT_METHODS) as [string, ...string[]]),
  specialInstructions: z.string().trim().max(500).optional()
});

export const cancelOrderSchema = z.object({
  reason: z.string().trim().max(255).optional()
});

export const updateOrderStatusSchema = z.object({
  status: z.enum(Object.values(ORDER_STATUSES) as [string, ...string[]]),
  reason: z.string().trim().max(255).optional()
});

export const assignRiderSchema = z.object({
  riderId: z.number().int().positive()
});

export const confirmReceiptSchema = z.object({
  phone: z.string().trim().min(6).max(20).optional()
});

export const rateOrderSchema = z.object({
  rating: z.number().int().min(1).max(5),
  deliveryRating: z.number().int().min(1).max(5).optional(),
  comment: z.string().trim().max(500).optional()
});

export const orderQuerySchema = paginationQuerySchema.extend({
  status: z.enum(Object.values(ORDER_STATUSES) as [string, ...string[]]).optional(),
  restaurantId: z.coerce.number().int().positive().optional(),
  customerId: z.coerce.number().int().positive().optional(),
  riderId: z.coerce.number().int().positive().optional(),
  paymentMethod: z.enum(Object.values(PAYMENT_METHODS) as [string, ...string[]]).optional(),
  from: z.string().optional(),
  to: z.string().optional()
});

export const deliveriesQuerySchema = paginationQuerySchema.extend({
  status: z.enum(Object.values(DELIVERY_STATUSES) as [string, ...string[]]).optional(),
  riderId: z.coerce.number().int().positive().optional(),
  restaurantId: z.coerce.number().int().positive().optional()
});

export const updateDeliveryStatusSchema = z.object({
  status: z.enum(Object.values(DELIVERY_STATUSES) as [string, ...string[]]),
  note: z.string().trim().max(255).optional()
});

export const paymentsQuerySchema = paginationQuerySchema.extend({
  status: z.enum(['PENDING', 'SUCCESS', 'FAILED', 'REFUNDED']).optional(),
  method: z.enum(Object.values(PAYMENT_METHODS) as [string, ...string[]]).optional(),
  from: z.string().optional(),
  to: z.string().optional()
});

export const processPaymentSchema = z.object({
  cardNumber: z.string().regex(/^\d{15,16}$/, 'Invalid card number'),
  cardName: z.string().trim().min(2).max(120),
  expiry: z.string().regex(/^(0[1-9]|1[0-2])\/\d{2}$/, 'Use MM/YY format'),
  cvv: z.string().regex(/^\d{3,4}$/, 'Invalid CVV'),
  provider: z.string().optional(),
  transactionId: z.string().optional()
});

export const guestProcessPaymentSchema = processPaymentSchema.extend({
  phone: z.string().trim().min(6).max(20)
});

export const flwInitiateSchema = z.object({
  orderId: z.coerce.number().int().positive(),
  phone: z.string().trim().min(6).max(20).optional(),
  email: z.string().email().optional(),
  name: z.string().trim().max(120).optional()
});

export const flwVerifySchema = z.object({
  orderId: z.coerce.number().int().positive(),
  transactionId: z.coerce.string().trim().min(1).max(100),
  txRef: z.string().trim().min(1).max(100).optional(),
  amount: z.coerce.number().positive().optional(),
  status: z.string().optional(),
  phone: z.string().trim().min(6).max(20).optional()
});