import { Op, fn, col, WhereOptions } from 'sequelize';
import { sequelize } from '../config/database';
import { ORDER_STATUSES, PAYMENT_STATUSES, ROLES } from '../config/constants';
import {
  Order,
  OrderItem,
  Payment,
  Delivery,
  User,
  Restaurant,
  Customer,
  Rider,
  RestaurantStaff,
  FoodItem
} from '../models';
import { ApiError } from '../utils/ApiError';

const daysAgo = (days: number) => new Date(Date.now() - days * 24 * 60 * 60 * 1000);

const lastNDaysLabels = (n: number) => {
  const labels: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    labels.push(d.toISOString().slice(0, 10));
  }
  return labels;
};

interface ChartPoint {
  label: string;
  value: number;
}

const fillDateSeries = (rows: { date: string; value: string | number }[], n: number): ChartPoint[] => {
  const map = new Map<string, number>();
  for (const r of rows) map.set(String(r.date), Number(r.value));
  return lastNDaysLabels(n).map((label) => ({ label, value: map.get(label) ?? 0 }));
};

const orderStatusDistribution = async (where?: WhereOptions) => {
  const rows = await Order.findAll({
    where: where ?? {},
    attributes: ['status', [fn('COUNT', col('id')), 'count']],
    group: ['status']
  });
  return rows.map((r) => ({ status: r.get('status'), count: Number(r.get('count')) }));
};

const salesSeries = async (n: number, paymentWhere: WhereOptions = {}) => {
  const rows = await Payment.findAll({
    where: { status: PAYMENT_STATUSES.SUCCESS, ...paymentWhere, createdAt: { [Op.gte]: daysAgo(n) } },
    attributes: [[fn('DATE', col('Payment.created_at')), 'date'], [fn('SUM', col('Payment.amount')), 'value']],
    group: [fn('DATE', col('Payment.created_at'))],
    raw: true
  });
  return fillDateSeries(rows as unknown as { date: string; value: string }[], n);
};

const orderSeries = async (n: number, orderWhere: WhereOptions = {}) => {
  const rows = await Order.findAll({
    where: { ...orderWhere, createdAt: { [Op.gte]: daysAgo(n) } },
    attributes: [[fn('DATE', col('created_at')), 'date'], [fn('COUNT', col('id')), 'value']],
    group: [fn('DATE', col('created_at'))],
    raw: true
  });
  return fillDateSeries(rows as unknown as { date: string; value: string }[], n);
};

const popularFoodItems = async (restaurantId?: number) => {
  const rows = await OrderItem.findAll({
    include: restaurantId ? [{ model: Order, as: 'order', where: { restaurantId }, attributes: [] }] : undefined,
    attributes: ['name', [fn('SUM', col('OrderItem.quantity')), 'totalQuantity'], [fn('SUM', col('OrderItem.subtotal')), 'revenue']],
    group: ['name'],
    order: [[fn('SUM', col('OrderItem.quantity')), 'DESC']],
    limit: 10,
    raw: true,
    subQuery: false
  }) as unknown as { name: string; totalQuantity: string; revenue: string }[];
  return rows.map((r) => ({
    name: r.name,
    sold: Number(r.totalQuantity),
    revenue: Number(r.revenue)
  }));
};

const genericTotals = async (where: WhereOptions = {}) => {
  const [pending, confirmed, preparing, ready, riderAssigned, outForDelivery, delivered, cancelled, rejected] =
    await Promise.all([
      Order.count({ where: { ...where, status: ORDER_STATUSES.PENDING } }),
      Order.count({ where: { ...where, status: ORDER_STATUSES.CONFIRMED } }),
      Order.count({ where: { ...where, status: ORDER_STATUSES.PREPARING } }),
      Order.count({ where: { ...where, status: ORDER_STATUSES.READY_FOR_PICKUP } }),
      Order.count({ where: { ...where, status: ORDER_STATUSES.RIDER_ASSIGNED } }),
      Order.count({ where: { ...where, status: ORDER_STATUSES.OUT_FOR_DELIVERY } }),
      Order.count({ where: { ...where, status: ORDER_STATUSES.DELIVERED } }),
      Order.count({ where: { ...where, status: ORDER_STATUSES.CANCELLED } }),
      Order.count({ where: { ...where, status: ORDER_STATUSES.REJECTED } })
    ]);
  return { pending, confirmed, preparing, ready, riderAssigned, outForDelivery, delivered, cancelled, rejected };
};

export const getAdminDashboard = async () => {
  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
  const [
    totalCustomers,
    totalRestaurants,
    pendingRestaurants,
    totalRiders,
    totalOrders,
    todayOrders,
    totalRevenue,
    todayRevenue,
    pendingPayments,
    revenueByRestaurant,
    sales30,
    sales7,
    orders30,
    statusDist,
    popular,
    recentOrders
  ] = await Promise.all([
    Customer.count(),
    Restaurant.count(),
    Restaurant.count({ where: { approvalStatus: 'PENDING' } }),
    Rider.count(),
    Order.count(),
    Order.count({ where: { createdAt: { [Op.gte]: todayStart } } }),
    Payment.sum('amount', { where: { status: PAYMENT_STATUSES.SUCCESS } }),
    Payment.sum('amount', { where: { status: PAYMENT_STATUSES.SUCCESS, createdAt: { [Op.gte]: todayStart } } }),
    Payment.count({ where: { status: PAYMENT_STATUSES.PENDING } }),
    Payment.findAll({
      where: { status: PAYMENT_STATUSES.SUCCESS },
      attributes: [[sequelize.literal('`order->restaurant`.`name`'), 'name'], [fn('SUM', col('Payment.amount')), 'revenue']],
      include: [{ model: Order, as: 'order', attributes: [], include: [{ model: Restaurant, as: 'restaurant', attributes: [] }] }],
      group: [sequelize.literal('`order->restaurant`.`name`') as unknown as string],
      order: [[fn('SUM', col('Payment.amount')), 'DESC']],
      limit: 8,
      raw: true,
      subQuery: false
    }) as unknown as { name: string; revenue: string }[],
    salesSeries(30),
    salesSeries(7),
    orderSeries(30),
    orderStatusDistribution(),
    popularFoodItems(),
    Order.findAll({ order: [['createdAt', 'DESC']], limit: 10, attributes: ['id', 'orderNumber', 'status', 'total', 'createdAt'] })
  ]);

  const totals = await genericTotals();
  const activeDeliveries = await Delivery.count({ where: { status: { [Op.in]: ['ASSIGNED', 'ACCEPTED', 'PICKED_UP', 'OUT_FOR_DELIVERY'] } } });

  return {
    counts: {
      totalCustomers: Number(totalCustomers) || 0,
      totalRestaurants: Number(totalRestaurants) || 0,
      pendingRestaurants: Number(pendingRestaurants) || 0,
      totalRiders: Number(totalRiders) || 0,
      totalOrders: Number(totalOrders) || 0,
      todayOrders: Number(todayOrders) || 0,
      activeDeliveries: Number(activeDeliveries) || 0,
      pendingPayments: Number(pendingPayments) || 0
    },
    revenue: {
      total: Number(totalRevenue) || 0,
      today: Number(todayRevenue) || 0
    },
    orders: totals,
    charts: {
      sales30,
      sales7,
      orders30,
      statusDistribution: statusDist,
      revenueByRestaurant: revenueByRestaurant.map((r) => ({ name: r.name, value: Number(r.revenue) })),
      popularItems: popular
    },
    recentOrders
  };
};

export const getRestaurantDashboard = async (userId: number) => {
  const staff = await RestaurantStaff.findOne({ where: { userId } });
  if (!staff) throw ApiError.forbidden('No restaurant linked to this account');
  const restaurantId = staff.restaurantId;

  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
  const [CategoryModel, DeliveryModel] = [await import('../models/Category').then(m => m.default), await import('../models/Delivery').then(m => m.default)];

  const salesWhere: WhereOptions = {
    status: PAYMENT_STATUSES.SUCCESS,
    createdAt: { [Op.gte]: daysAgo(30) }
  };

  const [
    totalOrders,
    todayOrders,
    pendingOrders,
    completedOrders,
    revenue,
    readyForPickup,
    sales30,
    orders30,
    statusDist,
    popular,
    recentOrders,
    categories,
    online,
    cash
  ] = await Promise.all([
    Order.count({ where: { restaurantId } }),
    Order.count({ where: { restaurantId, createdAt: { [Op.gte]: todayStart } } }),
    Order.count({ where: { restaurantId, status: ORDER_STATUSES.PENDING } }),
    Order.count({ where: { restaurantId, status: ORDER_STATUSES.DELIVERED } }),
    Payment.findAll({
      where: { status: PAYMENT_STATUSES.SUCCESS },
      attributes: [[fn('SUM', col('Payment.amount')), 'total']],
      include: [{ model: Order, as: 'order', where: { restaurantId }, attributes: [] }],
      raw: true,
      subQuery: false
    }).then((rows) => Number((rows as unknown as { total: string }[])[0]?.total) || 0),
    Order.count({ where: { restaurantId, status: ORDER_STATUSES.READY_FOR_PICKUP } }),
    (async () => {
      const rows = await Payment.findAll({
        where: salesWhere,
        include: [{ model: Order, as: 'order', where: { restaurantId }, attributes: [] }],
        attributes: [[fn('DATE', col('Payment.created_at')), 'date'], [fn('SUM', col('Payment.amount')), 'value']],
        group: [fn('DATE', col('Payment.created_at'))],
        raw: true,
        subQuery: false
      });
      return fillDateSeries(rows as unknown as { date: string; value: string }[], 30);
    })(),
    orderSeries(30, { restaurantId }),
    orderStatusDistribution({ restaurantId }),
    popularFoodItems(restaurantId),
    Order.findAll({
      where: { restaurantId },
      order: [['createdAt', 'DESC']],
      limit: 10,
      attributes: ['id', 'orderNumber', 'status', 'total', 'createdAt']
    }),
    CategoryModel.count({ where: { restaurantId } }),
    Payment.count({
      where: { status: PAYMENT_STATUSES.SUCCESS, method: 'CARD' },
      include: [{ model: Order, as: 'order', where: { restaurantId }, attributes: [] }]
    }),
    Payment.count({
      where: { status: PAYMENT_STATUSES.SUCCESS, method: 'CASH' },
      include: [{ model: Order, as: 'order', where: { restaurantId }, attributes: [] }]
    })
  ]);

  const pendingDeliveries = await DeliveryModel.count({
    where: { status: { [Op.in]: ['ASSIGNED'] } },
    include: [{ model: Order, as: 'order', where: { restaurantId }, attributes: [] }]
  });

  return {
    restaurantId,
    counts: {
      totalOrders: Number(totalOrders) || 0,
      todayOrders: Number(todayOrders) || 0,
      pendingOrders: Number(pendingOrders) || 0,
      completedOrders: Number(completedOrders) || 0,
      readyForPickup: Number(readyForPickup) || 0,
      categories: Number(categories) || 0,
      pendingDeliveries: Number(pendingDeliveries) || 0
    },
    revenue: { total: Number(revenue) || 0, online: Number(online) || 0, cash: Number(cash) || 0 },
    charts: { sales30, orders30, statusDistribution: statusDist, popularItems: popular },
    recentOrders
  };
};

export const getRiderDashboard = async (userId: number) => {
  const rider = await Rider.findOne({
    where: { userId },
    include: [
      { model: Restaurant, as: 'restaurant', attributes: ['id', 'name', 'phone', 'addressStreet', 'addressCity'] }
    ]
  });
  if (!rider) throw ApiError.forbidden('Rider profile not found');

  const activeStatuses = ['ASSIGNED', 'ACCEPTED', 'PICKED_UP', 'OUT_FOR_DELIVERY'];
  const [
    assigned, accepted, pickedUp, outForDelivery, completed, total,
    delivered7,
    completionSeries
  ] = await Promise.all([
    Delivery.count({ where: { riderId: rider.id, status: 'ASSIGNED' } }),
    Delivery.count({ where: { riderId: rider.id, status: 'ACCEPTED' } }),
    Delivery.count({ where: { riderId: rider.id, status: 'PICKED_UP' } }),
    Delivery.count({ where: { riderId: rider.id, status: 'OUT_FOR_DELIVERY' } }),
    Delivery.count({ where: { riderId: rider.id, status: 'DELIVERED' } }),
    Delivery.count({ where: { riderId: rider.id } }),
    Delivery.count({ where: { riderId: rider.id, status: 'DELIVERED', createdAt: { [Op.gte]: daysAgo(7) } } }),
    Delivery.findAll({
      where: { riderId: rider.id, createdAt: { [Op.gte]: daysAgo(7) } },
      attributes: [[fn('DATE', col('created_at')), 'date'], [fn('COUNT', col('Delivery.id')), 'value']],
      group: [fn('DATE', col('created_at'))],
      raw: true
    })
  ]);

  const active = await Delivery.findAll({
    where: { riderId: rider.id, status: { [Op.in]: activeStatuses } },
    include: [
      {
        model: Order,
        as: 'order',
        attributes: [
          'id', 'orderNumber', 'total', 'subtotal', 'deliveryFee', 'serviceFee',
          'deliveryAddress', 'status', 'paymentMethod', 'specialInstructions', 'placedAt'
        ],
        include: [
          { model: Restaurant, as: 'restaurant', attributes: ['id', 'name', 'phone', 'addressStreet', 'addressCity'] },
          { model: Payment, as: 'payment', attributes: ['id', 'status', 'amount', 'method', 'provider'] },
          { model: OrderItem, as: 'items', attributes: ['id', 'name', 'quantity', 'price', 'subtotal'] }
        ]
      }
    ],
    limit: 10,
    order: [['createdAt', 'DESC']]
  });

  // Incoming orders from the rider's linked restaurant
  const restaurantOrders = rider.restaurantId
    ? await Order.findAll({
        where: {
          restaurantId: rider.restaurantId,
          status: { [Op.in]: ['PENDING', 'CONFIRMED', 'PREPARING', 'READY_FOR_PICKUP'] }
        },
        include: [
          { model: Restaurant, as: 'restaurant', attributes: ['id', 'name', 'phone', 'addressStreet', 'addressCity'] },
          { model: Payment, as: 'payment', attributes: ['id', 'status', 'amount', 'method', 'provider'] },
          { model: OrderItem, as: 'items', attributes: ['id', 'name', 'quantity', 'price', 'subtotal'] }
        ],
        order: [['createdAt', 'DESC']],
        limit: 15
      })
    : [];

  // Available pickup orders across the platform (unassigned & ready)
  const availablePickupOrders = await Order.findAll({
    where: {
      status: ORDER_STATUSES.READY_FOR_PICKUP,
      riderId: null,
      ...(rider.restaurantId ? { restaurantId: rider.restaurantId } : {})
    },
    include: [
      { model: Restaurant, as: 'restaurant', attributes: ['id', 'name', 'phone', 'addressStreet', 'addressCity'] },
      { model: Payment, as: 'payment', attributes: ['id', 'status', 'amount', 'method', 'provider'] },
      { model: OrderItem, as: 'items', attributes: ['id', 'name', 'quantity', 'price', 'subtotal'] }
    ],
    order: [['createdAt', 'DESC']],
    limit: 15
  });

  const deliveredRecords = await Delivery.findAll({
    where: { riderId: rider.id, status: 'DELIVERED' },
    include: [{ model: Order, as: 'order', attributes: ['deliveryFee', 'placedAt'] }]
  });

  let totalEarnings = 0;
  let todayEarnings = 0;
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  for (const d of deliveredRecords) {
    const fee = Number((d.get('order') as { deliveryFee?: number })?.deliveryFee || 0);
    totalEarnings += fee;
    if (d.deliveredAt && new Date(d.deliveredAt) >= startOfToday) {
      todayEarnings += fee;
    }
  }

  return {
    rider: rider.toJSON(),
    isLinked: Boolean(rider.restaurantId),
    linkedRestaurant: (rider as { restaurant?: { id: number; name: string } }).restaurant ?? null,
    counts: {
      assigned: Number(assigned) || 0,
      accepted: Number(accepted) || 0,
      pickedUp: Number(pickedUp) || 0,
      outForDelivery: Number(outForDelivery) || 0,
      completed: Number(completed) || 0,
      totalAssignments: Number(total) || 0,
      deliveredLast7: Number(delivered7) || 0,
      activeCount: Number(assigned) + Number(accepted) + Number(pickedUp) + Number(outForDelivery),
      totalEarnings: Math.round(totalEarnings * 100) / 100,
      todayEarnings: Math.round(todayEarnings * 100) / 100
    },
    completionSeries: fillDateSeries(completionSeries as unknown as { date: string; value: string }[], 7),
    activeDeliveries: active,
    restaurantOrders,
    availablePickupOrders
  };
};

export const adminReports = async () => {
  const revenueByRestaurant = await Payment.findAll({
    where: { status: PAYMENT_STATUSES.SUCCESS },
    attributes: [[sequelize.literal('`order->restaurant`.`name`'), 'name'], [fn('SUM', col('Payment.amount')), 'revenue'], [fn('COUNT', col('Payment.id')), 'orders']],
    include: [{ model: Order, as: 'order', attributes: [], include: [{ model: Restaurant, as: 'restaurant', attributes: [] }] }],
    group: [sequelize.literal('`order->restaurant`.`name`') as unknown as string],
    order: [[fn('SUM', col('Payment.amount')), 'DESC']],
    raw: true,
    subQuery: false
  }) as unknown as { name: string; revenue: string; orders: string }[];

  const customers = await Customer.count();
  const restaurants = await Restaurant.count();
  const riders = await Rider.count();
  const paymentsByMethod = await Payment.findAll({
    where: { status: PAYMENT_STATUSES.SUCCESS },
    attributes: ['method', [fn('COUNT', col('id')), 'count'], [fn('SUM', col('Payment.amount')), 'amount']],
    group: ['method'],
    raw: true
  }) as unknown as { method: string; count: string; amount: string }[];
  const ordersByRestaurant = await Order.findAll({
    attributes: [[sequelize.literal('`restaurant`.`name`'), 'name'], [fn('COUNT', col('Order.id')), 'count']],
    include: [{ model: Restaurant, as: 'restaurant', attributes: [] }],
    group: [sequelize.literal('`restaurant`.`name`') as unknown as string],
    raw: true,
    subQuery: false
  }) as unknown as { name: string; count: string }[];

  return {
    totals: { customers, restaurants, riders },
    revenueByRestaurant: revenueByRestaurant.map((r) => ({ name: r.name, revenue: Number(r.revenue), orders: Number(r.orders) })),
    ordersByRestaurant: ordersByRestaurant.map((r) => ({ name: r.name, count: Number(r.count) })),
    paymentsByMethod: paymentsByMethod.map((r) => ({ method: r.method, count: Number(r.count), amount: Number(r.amount) }))
  };
};