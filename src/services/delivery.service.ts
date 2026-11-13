import { Op, WhereOptions } from 'sequelize';
import { sequelize } from '../config/database';
import { ORDER_STATUSES, PAYMENT_METHODS, PAYMENT_STATUSES, ROLES } from '../config/constants';
import { Delivery, Rider, User, Order, Customer, Restaurant, OrderStatusHistory, Payment } from '../models';
import { ApiError } from '../utils/ApiError';
import { getPagination, buildPageMeta } from '../utils/pagination';
import { createNotification } from '../utils/notify';

const DELIVERY_INCLUDE = [
  {
    model: Order,
    as: 'order',
    attributes: ['id', 'orderNumber', 'status', 'total', 'paymentMethod', 'deliveryAddress', 'specialInstructions'],
    include: [
      { model: Restaurant, as: 'restaurant', attributes: ['id', 'name', 'phone'] },
      {
        model: Customer,
        as: 'customer',
        attributes: ['id'],
        include: [{ model: User, as: 'user', attributes: ['id', 'firstName', 'lastName', 'phone'] }]
      }
    ]
  },
  {
    model: Rider,
    as: 'rider',
    attributes: ['id', 'vehicleType', 'licensePlate'],
    include: [{ model: User, as: 'user', attributes: ['id', 'firstName', 'lastName', 'phone'] }]
  }
];

const notifyCustomerOrder = async (order: Order, title: string, message: string) => {
  if (order.customerId == null) return;
  const customer = await Customer.findByPk(order.customerId);
  if (!customer) return;
  await createNotification({
    userId: customer.userId,
    title,
    message,
    type: 'ORDER',
    orderId: order.id
  });
};

export const updateDeliveryStatus = async (
  deliveryId: number,
  toStatus: string,
  note?: string
) => {
  const delivery = await Delivery.findByPk(deliveryId);
  if (!delivery) throw ApiError.notFound('Delivery not found');

  const order = await Order.findByPk(delivery.orderId);
  if (!order) throw ApiError.notFound('Linked order not found');

  const VALID_TRANSITIONS: Record<string, string[]> = {
    ASSIGNED: ['ACCEPTED', 'CANCELLED'],
    ACCEPTED: ['PICKED_UP'],
    PICKED_UP: ['OUT_FOR_DELIVERY'],
    OUT_FOR_DELIVERY: ['DELIVERED'],
    DELIVERED: [],
    CANCELLED: []
  };
  const allowed = VALID_TRANSITIONS[delivery.status] ?? [];
  if (!allowed.includes(toStatus)) {
    throw ApiError.badRequest(`Cannot transition delivery from ${delivery.status} to ${toStatus}`);
  }

  const now = new Date();
  const deliveryPayload: Record<string, unknown> = { status: toStatus };
  let newOrderStatus: (typeof ORDER_STATUSES)[keyof typeof ORDER_STATUSES] | null = null;
  const orderNote = note ?? null;

  if (toStatus === 'ACCEPTED') {
    deliveryPayload.acceptedAt = now;
  } else if (toStatus === 'PICKED_UP') {
    deliveryPayload.pickedUpAt = now;
    newOrderStatus = ORDER_STATUSES.PICKED_UP;
  } else if (toStatus === 'OUT_FOR_DELIVERY') {
    newOrderStatus = ORDER_STATUSES.OUT_FOR_DELIVERY;
  } else if (toStatus === 'DELIVERED') {
    deliveryPayload.deliveredAt = now;
    newOrderStatus = ORDER_STATUSES.DELIVERED;

    if (order.paymentMethod === PAYMENT_METHODS.CASH) {
      const payment = await Payment.findOne({ where: { orderId: order.id } });
      if (payment && payment.status !== PAYMENT_STATUSES.SUCCESS) {
        await payment.update({ status: PAYMENT_STATUSES.SUCCESS, paidAt: now });
      }
    }

    if (delivery.riderId) {
      const rider = await Rider.findByPk(delivery.riderId);
      if (rider) {
        await rider.update({
          availabilityStatus: 'AVAILABLE',
          totalDeliveries: rider.totalDeliveries + 1
        });
      }
    }
  }

  const previousOrderStatus = order.status;
  await sequelize.transaction(async (tx) => {
    await delivery.update(deliveryPayload, { transaction: tx });
    if (newOrderStatus && previousOrderStatus !== newOrderStatus) {
      const orderPayload: Record<string, unknown> = { status: newOrderStatus };
      await order.update(orderPayload, { transaction: tx });
      await OrderStatusHistory.create(
        {
          orderId: order.id,
          fromStatus: previousOrderStatus as typeof order.status,
          toStatus: newOrderStatus,
          note: orderNote
        },
        { transaction: tx }
      );
    }
  });

  const orderNumber = order.orderNumber;
  if (toStatus === 'PICKED_UP') {
    await notifyCustomerOrder(order, 'Order picked up', `Your order ${orderNumber} has been picked up by the rider.`);
  } else if (toStatus === 'OUT_FOR_DELIVERY') {
    await notifyCustomerOrder(order, 'Out for delivery', `Your order ${orderNumber} is on its way to you.`);
  } else if (toStatus === 'DELIVERED') {
    await notifyCustomerOrder(order, 'Order delivered', `Your order ${orderNumber} has been delivered. Enjoy your meal!`);
    const rider = delivery.riderId ? (await Rider.findByPk(delivery.riderId, { include: [{ model: User, as: 'user' }] }) as (Rider & { user: User }) | null) : null;
    if (rider?.user) {
      await createNotification({
        userId: rider.userId,
        title: 'Delivery payout credited',
        message: `Order ${orderNumber} delivered! Your delivery payout of ₦${Number(order.deliveryFee).toLocaleString()} has been automatically credited to your earnings.`,
        type: 'PAYMENT',
        orderId: order.id
      });
    }

    const { RestaurantStaff } = await import('../models');
    const staff = await RestaurantStaff.findAll({ where: { restaurantId: order.restaurantId } });
    for (const s of staff) {
      await createNotification({
        userId: s.userId,
        title: 'Order delivered · Food earnings settled',
        message: `Order ${orderNumber} has been delivered. ₦${Number(order.subtotal).toLocaleString()} food earnings has been settled to your restaurant.`,
        type: 'PAYMENT',
        orderId: order.id
      });
    }
  }

  return Delivery.findByPk(deliveryId, { include: DELIVERY_INCLUDE });
};

export interface DeliveriesQuery {
  page?: number;
  limit?: number;
  status?: string;
  riderId?: number;
  restaurantId?: number;
  search?: string;
}

export const listDeliveries = async (
  query: DeliveriesQuery,
  scope: { role: string; userId: number }
) => {
  const { page, limit, offset } = getPagination(query.page, query.limit);
  const where: WhereOptions = {};

  if (scope.role === ROLES.RIDER) {
    const rider = await Rider.findOne({ where: { userId: scope.userId } });
    if (!rider) throw ApiError.forbidden('Rider profile not found');
    where.riderId = rider.id;
  } else if (scope.role === ROLES.RESTAFF) {
    const { RestaurantStaff } = await import('../models');
    const staff = await RestaurantStaff.findOne({ where: { userId: scope.userId } });
    if (!staff) throw ApiError.forbidden('No restaurant linked');
    where['$order.restaurant_id$'] = staff.restaurantId;
  } else if (scope.role !== ROLES.ADMIN) {
    throw ApiError.forbidden('Access denied');
  }

  if (query.status) where.status = query.status;
  if (query.riderId) where.riderId = query.riderId;
  if (query.restaurantId) where['$order.restaurant_id$'] = query.restaurantId;
  if (query.search) where['$order.order_number$'] = { [Op.like]: `%${query.search}%` };

  const { count, rows } = await Delivery.findAndCountAll({
    where,
    include: DELIVERY_INCLUDE,
    limit,
    offset,
    order: [['createdAt', 'DESC']],
    distinct: true,
    subQuery: false
  });

  return { data: rows, meta: buildPageMeta(count, page, limit) };
};