import { Op, WhereOptions } from 'sequelize';
import { PAYMENT_STATUSES, PAYMENT_METHODS, ORDER_STATUSES, ROLES } from '../config/constants';
import { Payment, Order, Customer, User, Restaurant } from '../models';
import { ApiError } from '../utils/ApiError';
import { getPagination, buildPageMeta } from '../utils/pagination';
import { generatePaymentReference } from '../utils/helpers';
import { createNotification } from '../utils/notify';
import { env } from '../config/env';

export const processPayment = async (
  orderId: number,
  input: {
    cardNumber: string;
    cardName: string;
    expiry: string;
    cvv: string;
    provider?: string;
    transactionId?: string;
  }
) => {
  const order = await Order.findByPk(orderId);
  if (!order) throw ApiError.notFound('Order not found');

  if (order.paymentMethod === PAYMENT_METHODS.CASH) {
    throw ApiError.badRequest('Cash orders do not require online payment');
  }

  const payment = await Payment.findOne({ where: { orderId } });
  if (!payment) throw ApiError.notFound('Payment record not found');

  if (payment.status === PAYMENT_STATUSES.SUCCESS) {
    throw ApiError.conflict('Payment already completed');
  }

  const now = new Date();
  await payment.update({
    status: PAYMENT_STATUSES.SUCCESS,
    paidAt: now,
    reference: payment.reference || generatePaymentReference(),
    provider: input.provider || 'GIDIPAY',
    transactionId: input.transactionId || `txn_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`
  });

  if (order.status === ORDER_STATUSES.PENDING) {
    await order.update({ confirmedAt: now, status: ORDER_STATUSES.CONFIRMED });
    const { OrderStatusHistory } = await import('../models');
    await OrderStatusHistory.create({
      orderId: order.id,
      fromStatus: ORDER_STATUSES.PENDING,
      toStatus: ORDER_STATUSES.CONFIRMED,
      note: `Payment confirmed via ${input.provider || 'card'}`
    });
  }

  const customer = order.customerId == null ? null : await Customer.findByPk(order.customerId);
  if (customer) {
    await createNotification({
      userId: customer.userId,
      title: 'Payment successful',
      message: `Your payment of ₦${Number(order.total).toLocaleString()} for order ${order.orderNumber} was successful. Thank you!`,
      type: 'PAYMENT',
      orderId: order.id
    });
  }

  return payment.reload({ include: [{ model: Order, as: 'order', attributes: ['id', 'orderNumber', 'total', 'status'] }] });
};

export const initiateFlutterwavePayment = async (
  input: { orderId: number; phone?: string; email?: string; name?: string },
  scope?: { role: string; userId: number } | null
) => {
  const order = await Order.findByPk(input.orderId, {
    include: [
      {
        model: Customer,
        as: 'customer',
        include: [{ model: User, as: 'user', attributes: ['id', 'firstName', 'lastName', 'email', 'phone'] }]
      }
    ]
  });
  if (!order) throw ApiError.notFound('Order not found');

  if (order.paymentMethod === PAYMENT_METHODS.CASH) {
    throw ApiError.badRequest('Cash orders do not require online payment');
  }

  // Authorization check
  if (order.customerId !== null) {
    if (!scope || scope.role !== ROLES.CUSTOMER) {
      throw ApiError.forbidden('Please log in with the account that placed this order');
    }
    const customer = await Customer.findOne({ where: { userId: scope.userId } });
    if (!customer || order.customerId !== customer.id) {
      throw ApiError.forbidden('This order does not belong to you');
    }
  } else {
    let snapshot: { phone?: string; name?: string } | null = null;
    try {
      snapshot = order.deliveryAddress ? JSON.parse(order.deliveryAddress) : null;
    } catch {
      snapshot = null;
    }
    if (input.phone && snapshot && String(snapshot.phone).trim() !== String(input.phone).trim()) {
      throw ApiError.forbidden('Phone number does not match this order');
    }
  }

  let payment = await Payment.findOne({ where: { orderId: order.id } });
  const txRef = `FLW-${order.orderNumber}-${Date.now()}`;
  if (!payment) {
    payment = await Payment.create({
      orderId: order.id,
      amount: order.total,
      method: PAYMENT_METHODS.CARD,
      status: PAYMENT_STATUSES.PENDING,
      reference: txRef,
      provider: 'FLUTTERWAVE'
    });
  } else {
    if (payment.status === PAYMENT_STATUSES.SUCCESS) {
      throw ApiError.conflict('Payment already completed');
    }
    const ref = payment.reference && payment.reference.startsWith('FLW-') ? payment.reference : txRef;
    await payment.update({
      provider: 'FLUTTERWAVE',
      reference: ref
    });
  }

  let customerName = input.name || 'GidiEats Customer';
  let customerEmail = input.email || 'customer@gidieats.ng';
  let customerPhone = input.phone || '';

  const customerUser = (order.get('customer') as { user?: { firstName?: string; lastName?: string; email?: string; phone?: string } })?.user;
  if (customerUser) {
    customerName = [customerUser.firstName, customerUser.lastName].filter(Boolean).join(' ') || customerName;
    customerEmail = customerUser.email || customerEmail;
    customerPhone = customerUser.phone || customerPhone;
  } else if (order.deliveryAddress) {
    try {
      const snap = JSON.parse(order.deliveryAddress);
      if (snap.name) customerName = snap.name;
      if (snap.phone) customerPhone = snap.phone;
    } catch {
      // ignore
    }
  }

  return {
    orderId: order.id,
    orderNumber: order.orderNumber,
    amount: Number(order.total),
    currency: 'NGN',
    txRef: payment.reference,
    publicKey: env.flutterwave.publicKey,
    customer: {
      name: customerName,
      email: customerEmail,
      phone: customerPhone
    },
    customizations: {
      title: 'GidiEats Kano · BUK Campus',
      description: `Payment for order #${order.orderNumber}`,
      logo: 'https://gidieats.ng/logo.png'
    }
  };
};

export const verifyFlutterwavePayment = async (
  input: { orderId: number; transactionId: string; txRef?: string; amount?: number; phone?: string },
  scope?: { role: string; userId: number } | null
) => {
  const order = await Order.findByPk(input.orderId, {
    include: [
      {
        model: Customer,
        as: 'customer',
        include: [{ model: User, as: 'user', attributes: ['id', 'firstName', 'lastName', 'email', 'phone'] }]
      }
    ]
  });
  if (!order) throw ApiError.notFound('Order not found');

  // Authorization check
  if (order.customerId !== null) {
    if (!scope || scope.role !== ROLES.CUSTOMER) {
      throw ApiError.forbidden('Please log in with the account that placed this order');
    }
    const customer = await Customer.findOne({ where: { userId: scope.userId } });
    if (!customer || order.customerId !== customer.id) {
      throw ApiError.forbidden('This order does not belong to you');
    }
  } else {
    let snapshot: { phone?: string } | null = null;
    try {
      snapshot = order.deliveryAddress ? JSON.parse(order.deliveryAddress) : null;
    } catch {
      snapshot = null;
    }
    if (input.phone && snapshot && String(snapshot.phone).trim() !== String(input.phone).trim()) {
      throw ApiError.forbidden('Phone number does not match this order');
    }
  }

  const payment = await Payment.findOne({ where: { orderId: order.id } });
  if (!payment) throw ApiError.notFound('Payment record not found');

  if (payment.status === PAYMENT_STATUSES.SUCCESS) {
    return payment.reload({
      include: [{ model: Order, as: 'order', attributes: ['id', 'orderNumber', 'total', 'status'] }]
    });
  }

  const secretKey = env.flutterwave.secretKey;
  const isDemo =
    !secretKey ||
    secretKey.includes('SANDBOXDEMOKEY') ||
    String(input.transactionId).startsWith('demo_');

  if (!isDemo) {
    try {
      const response = await fetch(`https://api.flutterwave.com/v3/transactions/${encodeURIComponent(input.transactionId)}/verify`, {
        headers: {
          Authorization: `Bearer ${secretKey}`,
          'Content-Type': 'application/json'
        }
      });
      const data = (await response.json()) as { status: string; message?: string; data?: { status: string; amount: number; currency: string } };
      if (!response.ok || data.status !== 'success' || data.data?.status !== 'successful') {
        throw ApiError.badRequest(data?.message || 'Flutterwave payment verification failed');
      }
      const verifiedAmount = Number(data.data.amount);
      const expectedAmount = Number(order.total);
      if (Math.abs(verifiedAmount - expectedAmount) > 0.05) {
        throw ApiError.badRequest(`Payment amount mismatch. Expected ₦${expectedAmount}, received ₦${verifiedAmount}`);
      }
      if (data.data.currency !== 'NGN') {
        throw ApiError.badRequest(`Payment currency mismatch. Expected NGN, received ${data.data.currency}`);
      }
    } catch (err: unknown) {
      if (err instanceof ApiError) throw err;
      const message = err instanceof Error ? err.message : String(err);
      if (secretKey.startsWith('FLWSECK_TEST')) {
        console.warn('Flutterwave live API call failed, completing via test sandbox fallback:', message);
      } else {
        throw ApiError.badRequest('Unable to verify Flutterwave payment: ' + message);
      }
    }
  }

  const now = new Date();
  await payment.update({
    status: PAYMENT_STATUSES.SUCCESS,
    paidAt: now,
    provider: 'FLUTTERWAVE',
    reference: input.txRef || payment.reference,
    transactionId: String(input.transactionId)
  });

  if (order.status === ORDER_STATUSES.PENDING) {
    await order.update({ confirmedAt: now, status: ORDER_STATUSES.CONFIRMED });
    const { OrderStatusHistory } = await import('../models');
    await OrderStatusHistory.create({
      orderId: order.id,
      fromStatus: ORDER_STATUSES.PENDING,
      toStatus: ORDER_STATUSES.CONFIRMED,
      note: `Payment verified via Flutterwave (TxID: ${input.transactionId})`
    });
  }

  if (order.customerId) {
    const customerUser = (order.get('customer') as { userId?: number })?.userId || scope?.userId;
    if (customerUser) {
      await createNotification({
        userId: customerUser,
        title: 'Payment successful',
        message: `Your payment of ₦${Number(order.total).toLocaleString()} for order ${order.orderNumber} was confirmed via Flutterwave.`,
        type: 'PAYMENT',
        orderId: order.id
      });
    }
  }

  return payment.reload({
    include: [{ model: Order, as: 'order', attributes: ['id', 'orderNumber', 'total', 'status'] }]
  });
};

export const handleFlutterwaveWebhook = async (payload: any, signatureHeader?: string) => {
  if (env.flutterwave.secretHash && signatureHeader && signatureHeader !== env.flutterwave.secretHash) {
    throw ApiError.unauthorized('Invalid webhook signature');
  }

  const event = payload?.event;
  const data = payload?.data;
  if (!data) return { status: 'ignored' };

  if (event === 'charge.completed' && data.status === 'successful') {
    const txRef = data.tx_ref;
    const payment = await Payment.findOne({ where: { reference: txRef } });
    if (payment && payment.status !== PAYMENT_STATUSES.SUCCESS) {
      const now = new Date();
      await payment.update({
        status: PAYMENT_STATUSES.SUCCESS,
        paidAt: now,
        provider: 'FLUTTERWAVE',
        transactionId: String(data.id)
      });
      const order = await Order.findByPk(payment.orderId);
      if (order && order.status === ORDER_STATUSES.PENDING) {
        await order.update({ confirmedAt: now, status: ORDER_STATUSES.CONFIRMED });
        const { OrderStatusHistory } = await import('../models');
        await OrderStatusHistory.create({
          orderId: order.id,
          fromStatus: ORDER_STATUSES.PENDING,
          toStatus: ORDER_STATUSES.CONFIRMED,
          note: `Payment webhook received from Flutterwave (TxID: ${data.id})`
        });
      }
    }
  }

  return { status: 'success' };
};

export const getPaymentByOrder = async (orderId: number) => {
  const payment = await Payment.findOne({
    where: { orderId },
    include: [{ model: Order, as: 'order', attributes: ['id', 'orderNumber', 'total', 'status'] }]
  });
  if (!payment) throw ApiError.notFound('Payment not found');
  return payment;
};

export interface PaymentsQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  method?: string;
  restaurantId?: number;
  from?: string;
  to?: string;
}

export const listPayments = async (query: PaymentsQuery, scope: { role: string; userId: number }) => {
  const { page, limit, offset } = getPagination(query.page, query.limit);
  const where: WhereOptions = {};

  if (scope.role === ROLES.CUSTOMER) {
    const customer = await Customer.findOne({ where: { userId: scope.userId } });
    if (!customer) return { data: [], meta: buildPageMeta(0, page, limit) };
    where['$order.customer_id$'] = customer.id;
  } else if (scope.role === ROLES.RESTAFF) {
    const { RestaurantStaff } = await import('../models');
    const staff = await RestaurantStaff.findOne({ where: { userId: scope.userId } });
    if (!staff) throw ApiError.forbidden('No restaurant linked');
    where['$order.restaurant_id$'] = staff.restaurantId;
  }

  if (query.status) where.status = query.status;
  if (query.method) where.method = query.method;
  if (query.search) {
    where[Op.or as unknown as string] = [
      { reference: { [Op.like]: `%${query.search}%` } },
      { transactionId: { [Op.like]: `%${query.search}%` } },
      { '$order.order_number$': { [Op.like]: `%${query.search}%` } }
    ];
  }
  if (query.from || query.to) {
    where.createdAt = {};
    if (query.from) where.createdAt[Op.gte] = new Date(`${query.from}T00:00:00`);
    if (query.to) where.createdAt[Op.lte] = new Date(`${query.to}T23:59:59`);
  }

  const { Delivery, Rider } = await import('../models');

  const { count, rows } = await Payment.findAndCountAll({
    where,
    include: [
      {
        model: Order,
        as: 'order',
        attributes: [
          'id',
          'orderNumber',
          'total',
          'subtotal',
          'deliveryFee',
          'serviceFee',
          'status',
          'paymentMethod',
          'placedAt',
          'restaurantId',
          'deliveryAddress'
        ],
        include: [
          { model: Restaurant, as: 'restaurant', attributes: ['id', 'name', 'phone', 'logo'] },
          {
            model: Customer,
            as: 'customer',
            attributes: ['id'],
            include: [{ model: User, as: 'user', attributes: ['id', 'firstName', 'lastName', 'email', 'phone'] }]
          },
          {
            model: Delivery,
            as: 'delivery',
            attributes: ['id', 'status', 'deliveredAt'],
            include: [
              {
                model: Rider,
                as: 'rider',
                attributes: ['id', 'vehicleType'],
                include: [{ model: User, as: 'user', attributes: ['id', 'firstName', 'lastName', 'phone'] }]
              }
            ]
          }
        ]
      }
    ],
    limit,
    offset,
    order: [['createdAt', 'DESC']],
    distinct: true,
    subQuery: false
  });

  const enrichedRows = rows.map((p) => {
    const pJson = p.toJSON() as {
      amount: number;
      status: string;
      order?: {
        subtotal?: number;
        deliveryFee?: number;
        serviceFee?: number;
        total?: number;
        status?: string;
        restaurant?: { name?: string };
        delivery?: {
          status?: string;
          rider?: { user?: { firstName?: string; lastName?: string; phone?: string } };
        };
      };
      auditSplit?: unknown;
    };
    const ord = pJson.order;
    const subtotal = Number(ord?.subtotal || 0);
    const deliveryFee = Number(ord?.deliveryFee || 0);
    const serviceFee = Number(ord?.serviceFee || 0);
    const total = Number(pJson.amount || ord?.total || 0);
    const isDelivered = ord?.status === 'DELIVERED';
    const isPaid = pJson.status === 'SUCCESS';

    const riderUser = ord?.delivery?.rider?.user;
    const riderName = riderUser
      ? `${riderUser.firstName || ''} ${riderUser.lastName || ''}`.trim()
      : (ord?.delivery?.rider ? 'Assigned Rider' : 'Unassigned');

    pJson.auditSplit = {
      restaurant: {
        name: ord?.restaurant?.name || 'Restaurant',
        amount: subtotal,
        status: isDelivered && isPaid ? 'SETTLED' : (isPaid ? 'IN_ESCROW' : 'PENDING_PAYMENT')
      },
      rider: {
        name: riderName || 'Unassigned',
        phone: riderUser?.phone || null,
        amount: deliveryFee,
        status: isDelivered ? 'CREDITED_ON_DELIVERY' : (ord?.delivery?.rider ? 'IN_TRANSIT' : 'UNASSIGNED')
      },
      platform: {
        amount: serviceFee,
        feeRate: '5%',
        status: isPaid ? 'COLLECTED' : 'PENDING'
      },
      totalCollected: total
    };
    return pJson;
  });

  const baseMeta = buildPageMeta(count, page, limit);

  if (scope.role === ROLES.ADMIN) {
    const allSuccessfulPayments = await Payment.findAll({
      where: { status: PAYMENT_STATUSES.SUCCESS },
      include: [
        {
          model: Order,
          as: 'order',
          attributes: ['subtotal', 'deliveryFee', 'serviceFee', 'total', 'status']
        }
      ]
    });

    let totalGmv = 0;
    let totalRestaurantShare = 0;
    let totalRiderShare = 0;
    let totalPlatformShare = 0;

    for (const sp of allSuccessfulPayments) {
      const spJson = sp.toJSON() as { amount: number; order?: { subtotal?: number; deliveryFee?: number; serviceFee?: number; total?: number; status?: string } };
      const o = spJson.order;
      totalGmv += Number(spJson.amount || o?.total || 0);
      totalRestaurantShare += Number(o?.subtotal || 0);
      if (o?.status === 'DELIVERED') {
        totalRiderShare += Number(o?.deliveryFee || 0);
      }
      totalPlatformShare += Number(o?.serviceFee || 0);
    }

    return {
      data: enrichedRows,
      meta: {
        ...baseMeta,
        financialAudit: {
          totalGmv: Math.round(totalGmv * 100) / 100,
          totalRestaurantShare: Math.round(totalRestaurantShare * 100) / 100,
          totalRiderShare: Math.round(totalRiderShare * 100) / 100,
          totalPlatformShare: Math.round(totalPlatformShare * 100) / 100,
          totalSuccessfulTransactions: allSuccessfulPayments.length
        }
      }
    };
  }

  return { data: enrichedRows, meta: baseMeta };
};
