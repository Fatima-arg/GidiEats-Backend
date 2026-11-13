import { Op, WhereOptions } from 'sequelize';
import { sequelize } from '../config/database';
import {
  ORDER_STATUSES,
  PAYMENT_METHODS,
  PAYMENT_STATUSES,
  ROLES,
  OrderStatus
} from '../config/constants';
import {
  Order,
  OrderItem,
  Payment,
  Delivery,
  OrderStatusHistory,
  Customer,
  FoodItem,
  Restaurant,
  User,
  Rider,
  Address,
  OrderRating
} from '../models';
import { ApiError } from '../utils/ApiError';
import { getPagination, buildPageMeta } from '../utils/pagination';
import { generateOrderNumber, generatePaymentReference } from '../utils/helpers';
import { createNotification } from '../utils/notify';

export const ORDER_INCLUDE = (role: string): object[] => {
  const includes: object[] = [
    {
      model: OrderItem,
      as: 'items',
      include: [{ model: FoodItem, as: 'foodItem', attributes: ['id', 'name', 'image'] }]
    },
    { model: Payment, as: 'payment' },
    { model: Delivery, as: 'delivery' },
    {
      model: Restaurant,
      as: 'restaurant',
      attributes: ['id', 'name', 'slug', 'logo', 'addressStreet', 'addressCity', 'addressState', 'phone']
    },
    {
      model: Customer,
      as: 'customer',
      attributes: ['id'],
      include: [{ model: User, as: 'user', attributes: ['id', 'firstName', 'lastName', 'email', 'phone'] }]
    }
  ];
  includes.push({
    model: Rider,
    as: 'rider',
    attributes: ['id', 'vehicleType', 'rating'],
    include: [
      {
        model: User,
        as: 'user',
        attributes: role === ROLES.CUSTOMER ? ['id', 'firstName', 'lastName'] : ['id', 'firstName', 'lastName', 'phone']
      }
    ]
  });
  includes.push({
    model: OrderStatusHistory,
    as: 'statusHistory',
    order: [['createdAt', 'ASC']]
  });
  includes.push({ model: OrderRating, as: 'rating' });
  return includes;
};

export interface CreateOrderInput {
  customerId: number | null;
  restaurantId: number;
  items: { foodItemId: number; quantity: number }[];
  addressId?: number;
  deliveryAddress?: { name: string; phone: string; street: string; city: string; state: string };
  paymentMethod: string;
  specialInstructions?: string;
}

const parseDeliverySnapshot = (raw: string | null): { name: string; phone: string; street: string; city: string; state: string } | null => {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && typeof parsed.phone === 'string') return parsed;
    return null;
  } catch {
    return null;
  }
};

export const createOrder = async (input: CreateOrderInput) => {
  const isGuest = input.customerId === null;
  if (isGuest && input.addressId) {
    throw ApiError.badRequest('Guest orders must include a delivery address');
  }

  let customer: Customer | null = null;
  if (!isGuest) {
    customer = await Customer.findOne({
      where: { userId: input.customerId as number },
      include: [{ model: User, as: 'user', attributes: ['id', 'firstName', 'lastName'] }]
    });
    if (!customer) throw ApiError.notFound('Customer profile not found');
  }

  const restaurant = await Restaurant.findByPk(input.restaurantId);
  if (!restaurant) throw ApiError.notFound('Restaurant not found');
  if (!restaurant.isActive || restaurant.approvalStatus !== 'APPROVED') {
    throw ApiError.badRequest('This restaurant is not currently accepting orders');
  }

  const foodItemIds = input.items.map((i) => i.foodItemId);
  const menuItems = await FoodItem.findAll({
    where: { id: { [Op.in]: foodItemIds }, restaurantId: restaurant.id }
  });
  if (menuItems.length !== foodItemIds.length) {
    throw ApiError.badRequest('One or more food items are not available at this restaurant');
  }

  const subtotalMap = new Map<number, number>();
  let subtotal = 0;
  for (const item of input.items) {
    const food = menuItems.find((f) => f.id === item.foodItemId);
    if (!food) throw ApiError.notFound('Food item not found');
    if (!food.isAvailable) throw ApiError.badRequest(`"${food.name}" is currently unavailable`);
    const lineTotal = Number(food.price) * item.quantity;
    subtotalMap.set(item.foodItemId, lineTotal);
    subtotal += lineTotal;
  }

  let deliverySnapshot: string | null = null;
  let addressId: number | null = null;

  if (input.addressId && customer) {
    const address = await Address.findByPk(input.addressId);
    if (!address || address.customerId !== customer.id) {
      throw ApiError.badRequest('Invalid delivery address');
    }
    addressId = address.id;
    const customerUser = customer.get('user') as { firstName?: string; lastName?: string } | undefined;
    deliverySnapshot = JSON.stringify({
      name: [customerUser?.firstName, customerUser?.lastName].filter(Boolean).join(' ').trim() || `${customer.get('userId')}`,
      phone: address.phone,
      street: address.street,
      city: address.city,
      state: address.state
    });
  } else if (input.deliveryAddress) {
    deliverySnapshot = JSON.stringify(input.deliveryAddress);
  } else {
    throw ApiError.badRequest('A delivery address is required');
  }

  const deliveryFee = Number(restaurant.deliveryFee || 0);
  const serviceFee = Math.round(subtotal * 0.05 * 100) / 100;
  const total = subtotal + deliveryFee + serviceFee;

  const orderNumber = generateOrderNumber();

  const newOrder = await sequelize.transaction(async (tx) => {
    const order = await Order.create(
      {
        orderNumber,
        customerId: customer?.id ?? null,
        restaurantId: restaurant.id,
        addressId,
        deliveryAddress: deliverySnapshot,
        status: ORDER_STATUSES.PENDING,
        subtotal,
        deliveryFee,
        serviceFee,
        discount: 0,
        total,
        paymentMethod: input.paymentMethod as typeof PAYMENT_METHODS[keyof typeof PAYMENT_METHODS],
        specialInstructions: input.specialInstructions ?? null,
        placedAt: new Date()
      },
      { transaction: tx }
    );

    await OrderItem.bulkCreate(
      input.items.map((item) => {
        const food = menuItems.find((f) => f.id === item.foodItemId)!;
        return {
          orderId: order.id,
          foodItemId: food.id,
          name: food.name,
          price: Number(food.price),
          quantity: item.quantity,
          subtotal: subtotalMap.get(food.id)!
        };
      }),
      { transaction: tx }
    );

    await Payment.create(
      {
        orderId: order.id,
        amount: total,
        method: input.paymentMethod as typeof PAYMENT_METHODS[keyof typeof PAYMENT_METHODS],
        status:
          input.paymentMethod === PAYMENT_METHODS.CASH
            ? PAYMENT_STATUSES.PENDING
            : PAYMENT_STATUSES.PENDING,
        reference: generatePaymentReference()
      },
      { transaction: tx }
    );

    await OrderStatusHistory.create(
      { orderId: order.id, fromStatus: null, toStatus: ORDER_STATUSES.PENDING, note: 'Order placed' },
      { transaction: tx }
    );

    if (customer) {
      await createNotification({
        userId: input.customerId as number,
        title: 'Order received',
        message: `Your order ${orderNumber} has been placed and is awaiting confirmation by ${restaurant.name}.`,
        type: 'ORDER',
        orderId: order.id
      });
    }

    // Notify restaurant staff of new incoming order
    const { RestaurantStaff } = await import('../models');
    const staff = await RestaurantStaff.findAll({ where: { restaurantId: restaurant.id } });
    for (const s of staff) {
      await createNotification({
        userId: s.userId,
        title: 'New order received',
        message: `New order ${orderNumber} placed for ₦${total.toLocaleString()}. Awaiting kitchen review.`,
        type: 'ORDER',
        orderId: order.id
      });
    }

    // Notify dedicated in-house rider if linked to this restaurant
    const linkedRider = await Rider.findOne({
      where: { restaurantId: restaurant.id, isActive: true },
      include: [{ model: User, as: 'user' }]
    });
    if (linkedRider) {
      await createNotification({
        userId: linkedRider.userId,
        title: 'New incoming restaurant order',
        message: `Order ${orderNumber} has been placed at ${restaurant.name} (₦${total.toLocaleString()}). Ready for upcoming delivery!`,
        type: 'DELIVERY',
        orderId: order.id
      });
    }

    return order;
  });

  return getOrderById(newOrder.id);
};

export const trackOrder = async (orderNumber: string, phone: string) => {
  const order = await Order.findOne({
    where: { orderNumber },
    include: [
      {
        model: Restaurant,
        as: 'restaurant',
        attributes: ['id', 'name', 'slug', 'logo', 'phone', 'addressStreet', 'addressCity', 'addressState']
      },
      {
        model: OrderItem,
        as: 'items',
        include: [{ model: FoodItem, as: 'foodItem', attributes: ['id', 'name', 'image'] }]
      },
      {
        model: Payment,
        as: 'payment',
        attributes: ['id', 'amount', 'status', 'method', 'reference', 'provider', 'transactionId', 'paidAt']
      },
      { model: OrderStatusHistory, as: 'statusHistory', order: [['createdAt', 'ASC']] }
    ]
  });
  if (!order) throw ApiError.notFound('Order not found');

  const snapshot = parseDeliverySnapshot(order.deliveryAddress);
  if (!snapshot || String(snapshot.phone).trim() !== String(phone).trim()) {
    throw ApiError.notFound('Order not found');
  }
  return order;
};

// Guests have no account, so we recognise them by the phone on the delivery
// address they entered at checkout and list every order placed with it.
export const guestOrderHistory = async (phone: string) => {
  const normalized = String(phone).trim();
  if (!normalized) throw ApiError.badRequest('Phone number is required');

  const orders = await Order.findAll({
    where: { deliveryAddress: { [Op.like]: `%"phone":"${normalized}"%` } },
    include: [
      {
        model: Restaurant,
        as: 'restaurant',
        attributes: ['id', 'name', 'slug', 'logo']
      },
      {
        model: OrderItem,
        as: 'items',
        include: [{ model: FoodItem, as: 'foodItem', attributes: ['id', 'name', 'image'] }]
      },
      {
        model: Payment,
        as: 'payment',
        attributes: ['id', 'amount', 'status', 'method', 'reference', 'provider', 'transactionId', 'paidAt']
      }
    ],
    order: [['placedAt', 'DESC']],
    limit: 100
  });

  return orders.filter((order) => {
    const snapshot = parseDeliverySnapshot(order.deliveryAddress);
    return snapshot ? String(snapshot.phone).trim() === normalized : false;
  });
};

export const getOrderById = async (id: number, viewerRole: string = ROLES.CUSTOMER) => {
  const order = await Order.findByPk(id, { include: ORDER_INCLUDE(viewerRole) });
  if (!order) throw ApiError.notFound('Order not found');
  return order;
};

// The final handshake: a customer (logged-in or guest) confirms they received
// and accept the delivered order. Recorded as customerConfirmedAt on the order.
export const confirmReceipt = async (
  orderId: number,
  actor: { role: string; userId: number } | null,
  phone?: string
) => {
  const order = await Order.findByPk(orderId);
  if (!order) throw ApiError.notFound('Order not found');

  if (order.status !== ORDER_STATUSES.DELIVERED) {
    throw ApiError.badRequest('You can only accept an order after it has been delivered');
  }

  if (actor && actor.role === ROLES.CUSTOMER) {
    const customer = order.customerId == null ? null : await Customer.findByPk(order.customerId);
    if (!customer || customer.userId !== actor.userId) {
      throw ApiError.forbidden('This order does not belong to you');
    }
  } else {
    const snapshot = parseDeliverySnapshot(order.deliveryAddress);
    if (!snapshot || !phone || String(snapshot.phone).trim() !== String(phone).trim()) {
      throw ApiError.forbidden('Phone number does not match the order');
    }
  }

  if (!order.customerConfirmedAt) {
    await order.update({ customerConfirmedAt: new Date() });
    await OrderStatusHistory.create({
      orderId: order.id,
      fromStatus: order.status,
      toStatus: order.status,
      note: 'Customer accepted delivery'
    });
  }

  return getOrderById(order.id, ROLES.CUSTOMER);
};

export interface RateOrderInput {
  rating: number;
  deliveryRating?: number;
  comment?: string;
}

// A delivered order's customer can rate the food and the delivery (once).
// Order ratings roll up into the restaurant's star rating; delivery ratings
// roll up into the rider's star rating.
export const rateOrder = async (
  orderId: number,
  input: RateOrderInput,
  actor: { role: string; userId: number }
) => {
  const order = await Order.findByPk(orderId);
  if (!order) throw ApiError.notFound('Order not found');

  if (actor.role !== ROLES.CUSTOMER) {
    throw ApiError.forbidden('Only the order customer can rate it');
  }
  const customer = order.customerId == null ? null : await Customer.findByPk(order.customerId);
  if (!customer || customer.userId !== actor.userId) {
    throw ApiError.forbidden('This order does not belong to you');
  }

  if (order.status !== ORDER_STATUSES.DELIVERED) {
    throw ApiError.badRequest('You can only rate an order after it has been delivered');
  }

  const existing = await OrderRating.findOne({ where: { orderId } });
  const prevRating = existing?.rating ?? 0;
  const prevDeliveryRating = existing?.deliveryRating ?? 0;

  await sequelize.transaction(async (tx) => {
    if (existing) {
      await existing.update(
        { rating: input.rating, deliveryRating: input.deliveryRating ?? null, comment: input.comment ?? null },
        { transaction: tx }
      );
    } else {
      await OrderRating.create(
        { orderId, rating: input.rating, deliveryRating: input.deliveryRating ?? null, comment: input.comment ?? null },
        { transaction: tx }
      );
    }
  });

  if (order.restaurantId) {
    const restaurant = await Restaurant.findByPk(order.restaurantId);
    if (restaurant) {
      const total = Number(restaurant.rating) * restaurant.ratingCount + input.rating - prevRating;
      const count = restaurant.ratingCount + (existing ? 0 : 1);
      await restaurant.update({ rating: +(total / Math.max(count, 1)).toFixed(2), ratingCount: count });
    }
  }
  if (order.riderId && input.deliveryRating) {
    const rider = await Rider.findByPk(order.riderId);
    if (rider) {
      const total = Number(rider.rating) * rider.ratingCount + input.deliveryRating - prevDeliveryRating;
      const count = rider.ratingCount + (existing ? 0 : 1);
      await rider.update({ rating: +(total / Math.max(count, 1)).toFixed(2), ratingCount: count });
    }
  }

  return getOrderById(order.id, ROLES.CUSTOMER);
};

export interface OrderQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  restaurantId?: number;
  customerId?: number;
  riderId?: number;
  paymentMethod?: string;
  from?: string;
  to?: string;
}

export const listOrders = async (query: OrderQuery, scope: { role: string; userId: number }) => {
  const { page, limit, offset } = getPagination(query.page, query.limit);
  const where: WhereOptions = {};
  const include: object[] = [];

  if (scope.role === ROLES.CUSTOMER) {
    const customer = await Customer.findOne({ where: { userId: scope.userId } });
    if (!customer) return { data: [], meta: buildPageMeta(0, page, limit) };
    where.customerId = customer.id;
    include.push({
      model: Restaurant,
      as: 'restaurant',
      attributes: ['id', 'name', 'slug', 'logo']
    });
    include.push({ model: OrderItem, as: 'items' });
    include.push({ model: Payment, as: 'payment', attributes: ['id', 'amount', 'status', 'method', 'reference'] });
  } else if (scope.role === ROLES.RESTAFF) {
    const { RestaurantStaff } = await import('../models');
    const staff = await RestaurantStaff.findOne({ where: { userId: scope.userId } });
    if (!staff) throw ApiError.forbidden('No restaurant linked to this account');
    where.restaurantId = staff.restaurantId;
    include.push(...ORDER_INCLUDE(scope.role));
  } else if (scope.role === ROLES.RIDER) {
    const rider = await Rider.findOne({ where: { userId: scope.userId } });
    if (!rider) throw ApiError.forbidden('Rider profile not found');
    where.riderId = rider.id;
    include.push(...ORDER_INCLUDE(scope.role));
  } else {
    // admin can filter by any scope
    if (query.restaurantId) where.restaurantId = query.restaurantId;
    if (query.customerId) where.customerId = query.customerId;
    if (query.riderId) where.riderId = query.riderId;
    include.push(...ORDER_INCLUDE(ROLES.ADMIN));
  }

  if (query.status) where.status = query.status;
  if (query.paymentMethod) where.paymentMethod = query.paymentMethod;
  if (query.search) where.orderNumber = { [Op.like]: `%${query.search}%` };
  if (query.from || query.to) {
    where.createdAt = {};
    if (query.from) where.createdAt[Op.gte] = new Date(`${query.from}T00:00:00`);
    if (query.to) where.createdAt[Op.lte] = new Date(`${query.to}T23:59:59`);
  }

  const { count, rows } = await Order.findAndCountAll({
    where,
    include,
    distinct: true,
    limit,
    offset,
    order: [['createdAt', 'DESC']]
  });

  return { data: rows, meta: buildPageMeta(count, page, limit) };
};

const STAFF_NEXT: Record<string, string[]> = {
  PENDING: ['CONFIRMED', 'REJECTED', 'CANCELLED'],
  CONFIRMED: ['PREPARING', 'REJECTED', 'CANCELLED'],
  PREPARING: ['READY_FOR_PICKUP'],
  READY_FOR_PICKUP: []
};

export const updateOrderStatus = async (
  orderId: number,
  toStatus: OrderStatus,
  actor: { role: string; userId: number },
  reason?: string
) => {
  const order = await Order.findByPk(orderId);
  if (!order) throw ApiError.notFound('Order not found');

  if (actor.role === ROLES.ADMIN) {
    // admin can hard-set any status
  } else if (actor.role === ROLES.RESTAFF) {
    const { RestaurantStaff } = await import('../models');
    const staff = await RestaurantStaff.findOne({ where: { userId: actor.userId } });
    if (!staff || staff.restaurantId !== order.restaurantId) {
      throw ApiError.forbidden('This order does not belong to your restaurant');
    }
    const allowed = STAFF_NEXT[order.status] ?? [];
    if (!allowed.includes(toStatus)) {
      throw ApiError.badRequest(
        `Cannot move order from ${order.status} to ${toStatus}`
      );
    }
  } else if (actor.role === ROLES.CUSTOMER) {
    if (toStatus !== ORDER_STATUSES.CANCELLED) {
      throw ApiError.forbidden('Customers can only cancel their own orders');
    }
    if (order.customerId == null) {
      throw ApiError.forbidden('This order does not belong to you');
    }
    const customer = await Customer.findByPk(order.customerId);
    if (!customer || customer.userId !== actor.userId) {
      throw ApiError.forbidden('This order does not belong to you');
    }
    if (!['PENDING', 'CONFIRMED'].includes(order.status)) {
      throw ApiError.badRequest('This order can no longer be cancelled');
    }
  } else {
    throw ApiError.forbidden('You cannot update this order');
  }

  if (!['CANCELLED', 'REJECTED'].includes(toStatus)) {
    const payment = await Payment.findOne({ where: { orderId: order.id } });
    if (payment && payment.method !== PAYMENT_METHODS.CASH && payment.status !== PAYMENT_STATUSES.SUCCESS) {
      throw ApiError.badRequest('Online payment via Flutterwave has not been received yet. The restaurant cannot advance or prepare the order until payment is verified.');
    }
  }

  const fromStatus = order.status;
  await sequelize.transaction(async (tx) => {
    const payload: Record<string, unknown> = { status: toStatus };
    const now = new Date();
    if (toStatus === ORDER_STATUSES.CONFIRMED) payload.confirmedAt = now;
    if (toStatus === ORDER_STATUSES.PREPARING) payload.preparingAt = now;
    if (toStatus === ORDER_STATUSES.READY_FOR_PICKUP) payload.readyAt = now;
    if (toStatus === ORDER_STATUSES.REJECTED) {
      payload.rejectedAt = now;
      payload.rejectionReason = reason ?? null;
    }
    if (toStatus === ORDER_STATUSES.CANCELLED) {
      payload.cancelledAt = now;
      payload.cancelReason = reason ?? null;
    }
    await order.update(payload as never, { transaction: tx });

    await OrderStatusHistory.create(
      {
        orderId: order.id,
        fromStatus,
        toStatus,
        note: reason ?? null
      },
      { transaction: tx }
    );
  });

  const customerId = order.customerId;
  try {
    if (toStatus === ORDER_STATUSES.CONFIRMED) {
      await notifyCustomer(customerId, order.orderNumber, 'Order accepted', `Great news! ${order.orderNumber} has been accepted and will be prepared shortly.`, order.id);
    } else if (toStatus === ORDER_STATUSES.PREPARING) {
      await notifyCustomer(customerId, order.orderNumber, 'Order being prepared', `Your order ${order.orderNumber} is being prepared by the kitchen.`, order.id);
    } else if (toStatus === ORDER_STATUSES.READY_FOR_PICKUP) {
      await notifyCustomer(customerId, order.orderNumber, 'Order ready for pickup', `Your order ${order.orderNumber} is ready and a rider will be assigned soon.`, order.id);
    } else if (toStatus === ORDER_STATUSES.REJECTED) {
      await notifyCustomer(customerId, order.orderNumber, 'Order rejected', `Unfortunately ${order.orderNumber} was rejected${reason ? `: ${reason}` : ''}.`, order.id);
    } else if (toStatus === ORDER_STATUSES.CANCELLED) {
      await notifyCustomer(customerId, order.orderNumber, 'Order cancelled', `Order ${order.orderNumber} has been cancelled.`, order.id);
    }
  } catch {
    // notification failures should never break the status update
  }

  return getOrderById(order.id, actor.role);
};

const notifyCustomer = async (customerId: number | null, orderNumber: string, title: string, message: string, orderId: number) => {
  if (customerId == null) return;
  const customer = await Customer.findByPk(customerId);
  if (!customer) return;
  await createNotification({
    userId: customer.userId,
    title,
    message,
    type: 'ORDER',
    orderId
  });
};

export const cancelOrder = async (orderId: number, customerUserId: number, reason?: string) => {
  const order = await Order.findByPk(orderId);
  if (!order) throw ApiError.notFound('Order not found');
  if (order.customerId == null) {
    throw ApiError.forbidden('This order does not belong to you');
  }
  const customer = await Customer.findByPk(order.customerId);
  if (!customer || customer.userId !== customerUserId) {
    throw ApiError.forbidden('This order does not belong to you');
  }
  if (!['PENDING', 'CONFIRMED'].includes(order.status)) {
    throw ApiError.badRequest('This order can no longer be cancelled');
  }
  await updateOrderStatus(orderId, ORDER_STATUSES.CANCELLED, { role: ROLES.CUSTOMER, userId: customerUserId }, reason);
  return getOrderById(orderId, ROLES.CUSTOMER);
};

export const assignRider = async (orderId: number, riderId: number, actor: { role: string; userId: number }) => {
  const order = await Order.findByPk(orderId);
  if (!order) throw ApiError.notFound('Order not found');

  if (actor.role === ROLES.RESTAFF) {
    const { RestaurantStaff } = await import('../models');
    const staff = await RestaurantStaff.findOne({ where: { userId: actor.userId } });
    if (!staff || staff.restaurantId !== order.restaurantId) {
      throw ApiError.forbidden('This order does not belong to your restaurant');
    }
  }

  if (order.status !== ORDER_STATUSES.READY_FOR_PICKUP) {
    throw ApiError.badRequest('Only orders that are ready for pickup can be assigned to a rider');
  }

  const rider = await Rider.findByPk(riderId, { include: [{ model: User, as: 'user', attributes: ['id', 'firstName', 'lastName', 'phone'] }] }) as (Rider & { user: User }) | null;
  if (!rider) throw ApiError.notFound('Rider not found');
  if (!rider.isActive) throw ApiError.badRequest('This rider is deactivated');
  if (rider.availabilityStatus !== 'AVAILABLE') {
    throw ApiError.badRequest('This rider is currently unavailable');
  }

  const existing = await Delivery.findOne({ where: { orderId } });
  if (existing && existing.status !== 'CANCELLED') {
    throw ApiError.conflict('A delivery already exists for this order');
  }

  const now = new Date();
  await sequelize.transaction(async (tx) => {
    await order.update(
      { riderId: rider.id, status: ORDER_STATUSES.RIDER_ASSIGNED, riderAssignedAt: now },
      { transaction: tx }
    );
    await OrderStatusHistory.create(
      {
        orderId: order.id,
        fromStatus: ORDER_STATUSES.READY_FOR_PICKUP,
        toStatus: ORDER_STATUSES.RIDER_ASSIGNED,
        note: `Rider assigned`
      },
      { transaction: tx }
    );
    if (existing) {
      await existing.update({ riderId: rider.id, status: 'ASSIGNED', assignedAt: now }, { transaction: tx });
    } else {
      await Delivery.create({ orderId, riderId: rider.id, status: 'ASSIGNED', assignedAt: now }, { transaction: tx });
    }
    await rider.update({ availabilityStatus: 'BUSY' }, { transaction: tx });
  });

  await createNotification({
    userId: rider.userId,
    title: 'New delivery assignment',
    message: `You have been assigned to deliver order ${order.orderNumber}. Please confirm when ready.`,
    type: 'DELIVERY',
    orderId: order.id
  });
  const customer = order.customerId == null ? null : await Customer.findByPk(order.customerId);
  if (customer) {
    await createNotification({
      userId: customer.userId,
      title: 'Rider assigned',
      message: `A rider (${rider.user.firstName} ${rider.user.lastName}) has been assigned to your order ${order.orderNumber}.`,
      type: 'ORDER',
      orderId: order.id
    });
  }

  return getOrderById(order.id, actor.role);
};

export const claimDelivery = async (orderId: number, riderUserId: number) => {
  const rider = await Rider.findOne({
    where: { userId: riderUserId },
    include: [{ model: User, as: 'user', attributes: ['id', 'firstName', 'lastName', 'phone'] }]
  }) as (Rider & { user: User }) | null;
  if (!rider) throw ApiError.forbidden('Rider profile not found');
  if (!rider.isActive) throw ApiError.badRequest('This rider account is deactivated');

  const order = await Order.findByPk(orderId, {
    include: [{ model: Restaurant, as: 'restaurant', attributes: ['id', 'name', 'phone'] }]
  });
  if (!order) throw ApiError.notFound('Order not found');

  // If rider is linked to a restaurant, ensure the order is from their restaurant
  if (rider.restaurantId && rider.restaurantId !== order.restaurantId) {
    throw ApiError.forbidden('You are dedicated to another restaurant and cannot claim this order');
  }

  const CLAIMABLE_STATUSES: string[] = [
    ORDER_STATUSES.READY_FOR_PICKUP,
    ORDER_STATUSES.PREPARING,
    ORDER_STATUSES.CONFIRMED
  ];
  if (!CLAIMABLE_STATUSES.includes(order.status)) {
    throw ApiError.badRequest(`Order is currently ${order.status} and cannot be claimed for delivery`);
  }

  if (order.riderId && order.riderId !== rider.id) {
    throw ApiError.conflict('Another rider has already been assigned to this order');
  }

  const existing = await Delivery.findOne({ where: { orderId } });
  if (existing && existing.riderId && existing.riderId !== rider.id && existing.status !== 'CANCELLED') {
    throw ApiError.conflict('A delivery has already been assigned for this order');
  }

  const now = new Date();
  await sequelize.transaction(async (tx) => {
    await order.update(
      { riderId: rider.id, status: ORDER_STATUSES.RIDER_ASSIGNED, riderAssignedAt: now },
      { transaction: tx }
    );
    await OrderStatusHistory.create(
      {
        orderId: order.id,
        fromStatus: order.status,
        toStatus: ORDER_STATUSES.RIDER_ASSIGNED,
        note: `Rider ${rider.user?.firstName ?? ''} accepted delivery`
      },
      { transaction: tx }
    );
    if (existing) {
      await existing.update(
        { riderId: rider.id, status: 'ACCEPTED', assignedAt: now, acceptedAt: now },
        { transaction: tx }
      );
    } else {
      await Delivery.create(
        { orderId: order.id, riderId: rider.id, status: 'ACCEPTED', assignedAt: now, acceptedAt: now },
        { transaction: tx }
      );
    }
    await rider.update({ availabilityStatus: 'BUSY' }, { transaction: tx });
  });

  const restaurantName = (order as { restaurant?: { name?: string } }).restaurant?.name || 'Restaurant';
  const customer = order.customerId == null ? null : await Customer.findByPk(order.customerId);
  if (customer) {
    await createNotification({
      userId: customer.userId,
      title: 'Rider assigned',
      message: `Your rider (${rider.user?.firstName ?? 'Rider'} ${rider.user?.lastName ?? ''}) has accepted order ${order.orderNumber} from ${restaurantName}.`,
      type: 'ORDER',
      orderId: order.id
    });
  }

  const { RestaurantStaff } = await import('../models');
  const staff = await RestaurantStaff.findAll({ where: { restaurantId: order.restaurantId } });
  for (const s of staff) {
    await createNotification({
      userId: s.userId,
      title: 'Rider accepted order',
      message: `Rider ${rider.user?.firstName ?? 'Rider'} ${rider.user?.lastName ?? ''} has accepted delivery for order ${order.orderNumber}.`,
      type: 'DELIVERY',
      orderId: order.id
    });
  }

  return getOrderById(order.id, ROLES.RIDER);
};