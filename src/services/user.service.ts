import { Op, WhereOptions } from 'sequelize';
import { ROLES, VEHICLE_TYPES, Role } from '../config/constants';
import { User, Customer, RestaurantStaff, Rider, Address } from '../models';
import Restaurant from '../models/Restaurant';
import { ApiError } from '../utils/ApiError';
import { getPagination, buildPageMeta } from '../utils/pagination';
import { sanitizeUser } from '../utils/helpers';
import { hashPassword } from './auth.service';

export const listUsers = async (query: {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  isActive?: string;
}) => {
  const { page, limit, offset } = getPagination(query.page, query.limit);
  const where: WhereOptions = {};
  if (query.role) where.role = query.role;
  if (query.isActive === 'true') where.isActive = true;
  if (query.isActive === 'false') where.isActive = false;
  if (query.search) {
    where[Op.or as never] = [
      { firstName: { [Op.like]: `%${query.search}%` } },
      { lastName: { [Op.like]: `%${query.search}%` } },
      { email: { [Op.like]: `%${query.search}%` } },
      { phone: { [Op.like]: `%${query.search}%` } }
    ];
  }

  const { count, rows } = await User.findAndCountAll({
    where,
    limit,
    offset,
    order: [['createdAt', 'DESC']],
    distinct: true,
    include: [
      {
        model: Customer,
        as: 'customer',
        attributes: ['id'],
        required: false,
        include: [{ model: Address, as: 'addresses', attributes: ['id', 'street', 'city', 'state'] }]
      },
      {
        model: RestaurantStaff,
        as: 'staff',
        required: false,
        include: [{ model: Restaurant, as: 'restaurant', attributes: ['id', 'name', 'logo'] }]
      },
      {
        model: Rider,
        as: 'rider',
        attributes: ['id', 'vehicleType', 'availabilityStatus', 'restaurantId', 'licensePlate', 'totalDeliveries', 'rating', 'isActive'],
        required: false,
        include: [{ model: Restaurant, as: 'restaurant', attributes: ['id', 'name', 'logo'] }]
      }
    ]
  });

  return {
    data: rows.map((u) => sanitizeUser(u.toJSON())),
    meta: buildPageMeta(count, page, limit)
  };
};

export const createUser = async (input: {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  role?: Role;
  restaurantId?: number | null;
  vehicleType?: string;
  licensePlate?: string | null;
  position?: string;
}) => {
  const existing = await User.findOne({ where: { email: input.email.toLowerCase().trim() } });
  if (existing) throw ApiError.conflict('An account with this email already exists');

  const passwordHash = await hashPassword(input.password);
  const role = input.role ?? ROLES.RIDER;

  const user = await User.create({
    firstName: input.firstName.trim(),
    lastName: input.lastName.trim(),
    email: input.email.toLowerCase().trim(),
    phone: input.phone.trim(),
    passwordHash,
    role
  });

  if (role === ROLES.CUSTOMER) {
    await Customer.create({ userId: user.id });
  } else if (role === ROLES.RESTAFF) {
    if (!input.restaurantId) throw ApiError.badRequest('restaurantId is required for restaurant staff');
    const restaurant = await Restaurant.findByPk(input.restaurantId);
    if (!restaurant) throw ApiError.notFound('Restaurant not found');
    await RestaurantStaff.create({
      userId: user.id,
      restaurantId: input.restaurantId,
      position: (input.position as RestaurantStaff['position']) ?? 'MANAGER'
    });
  } else if (role === ROLES.RIDER) {
    await Rider.create({
      userId: user.id,
      restaurantId: input.restaurantId || null,
      vehicleType: (input.vehicleType as Rider['vehicleType']) ?? VEHICLE_TYPES.MOTORCYCLE,
      licensePlate: input.licensePlate ?? null
    });
  }

  return getPublicUserById(user.id);
};

export const getPublicUserById = async (id: number) => {
  const user = await User.findByPk(id);
  if (!user) throw ApiError.notFound('User not found');
  const base = sanitizeUser(user.toJSON());
  if (user.role === ROLES.CUSTOMER) {
    const c = await Customer.findOne({
      where: { userId: id },
      include: [{ model: Address, as: 'addresses', attributes: ['id', 'street', 'city', 'state'] }]
    });
    if (c) base.customer = c.toJSON();
  } else if (user.role === ROLES.RESTAFF) {
    const s = await RestaurantStaff.findOne({
      where: { userId: id },
      include: [{ model: Restaurant, as: 'restaurant', attributes: ['id', 'name', 'logo'] }]
    });
    if (s) base.staff = s.toJSON();
  } else if (user.role === ROLES.RIDER) {
    const r = await Rider.findOne({
      where: { userId: id },
      include: [{ model: Restaurant, as: 'restaurant', attributes: ['id', 'name', 'logo'] }]
    });
    if (r) base.rider = r.toJSON();
  }
  return base;
};

export const updateUser = async (id: number, input: Record<string, unknown>) => {
  const user = await User.findByPk(id);
  if (!user) throw ApiError.notFound('User not found');

  const { restaff, rider, password, email, role, ...userFields } = input as Record<string, any>;

  const payload: Record<string, unknown> = { ...userFields };
  if (password) payload.passwordHash = await hashPassword(String(password));
  if (email && email.toLowerCase().trim() !== user.email) {
    const existing = await User.findOne({ where: { email: email.toLowerCase().trim(), id: { [Op.ne]: id } } });
    if (existing) throw ApiError.conflict('An account with this email already exists');
    payload.email = email.toLowerCase().trim();
  }
  if (role && role !== user.role) {
    payload.role = role;
    if (role === ROLES.CUSTOMER) {
      await Customer.findOrCreate({ where: { userId: user.id } });
    } else if (role === ROLES.RIDER) {
      await Rider.findOrCreate({
        where: { userId: user.id },
        defaults: { vehicleType: VEHICLE_TYPES.MOTORCYCLE, availabilityStatus: 'AVAILABLE' } as never
      });
    }
  }

  if (Object.keys(payload).length) {
    await user.update(payload as never);
  }

  if (restaff && (user.role === ROLES.RESTAFF || payload.role === ROLES.RESTAFF)) {
    const restaffPayload = {
      ...restaff,
      restaurantId: restaff.restaurantId ? Number(restaff.restaurantId) : null
    };
    let staff = await RestaurantStaff.findOne({ where: { userId: user.id } });
    if (staff) {
      await staff.update(restaffPayload);
    } else if (restaffPayload.restaurantId) {
      staff = await RestaurantStaff.create({ userId: user.id, ...restaffPayload });
    }
  }
  if (rider && (user.role === ROLES.RIDER || payload.role === ROLES.RIDER)) {
    const riderPayload = {
      ...rider,
      restaurantId: rider.restaurantId ? Number(rider.restaurantId) : null
    };
    let riderRow = await Rider.findOne({ where: { userId: user.id } });
    if (riderRow) {
      await riderRow.update(riderPayload);
    } else {
      await Rider.create({ userId: user.id, ...riderPayload });
    }
  }

  return getPublicUserById(user.id);
};

export const updateUserStatus = async (id: number, isActive: boolean) => {
  const user = await User.findByPk(id);
  if (!user) throw ApiError.notFound('User not found');
  await user.update({ isActive });
  return getPublicUserById(user.id);
};

export const listAvailableRiders = async () => {
  const riders = await Rider.findAll({
    where: { availabilityStatus: 'AVAILABLE', isActive: true },
    include: [
      { model: User, as: 'user', attributes: ['id', 'firstName', 'lastName', 'phone'] },
      { model: Restaurant, as: 'restaurant', attributes: ['id', 'name'] }
    ]
  });
  return riders.map((r) => ({ ...r.toJSON() }));
};