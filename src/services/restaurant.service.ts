import { Op, WhereOptions } from 'sequelize';
import Restaurant from '../models/Restaurant';
import { ApiError } from '../utils/ApiError';
import { getPagination, buildPageMeta } from '../utils/pagination';
import { slugify } from '../utils/helpers';

export interface RestaurantQuery {
  page?: number;
  limit?: number;
  search?: string;
  city?: string;
  cuisineType?: string;
  approvalStatus?: string;
  includeInactive?: string;
  sort?: string;
  order?: 'ASC' | 'DESC';
}

export const listRestaurants = async (query: RestaurantQuery) => {
  const { page, limit, offset } = getPagination(query.page, query.limit);

  const where: WhereOptions = {};
  if (query.search) {
    where[Op.or as never] = [
      { name: { [Op.like]: `%${query.search}%` } },
      { cuisineType: { [Op.like]: `%${query.search}%` } },
      { addressCity: { [Op.like]: `%${query.search}%` } }
    ];
  }
  if (query.city) where.addressCity = { [Op.like]: `%${query.city}%` };
  if (query.cuisineType) where.cuisineType = { [Op.like]: `%${query.cuisineType}%` };
  if (query.approvalStatus) where.approvalStatus = query.approvalStatus;

  const isCustomerView = query.includeInactive !== 'true';
  if (isCustomerView) {
    where.isActive = true;
    where.approvalStatus = 'APPROVED';
  }

  const sortField = query.sort ?? 'createdAt';
  const sortOrder = query.order ?? 'DESC';
  const sortable = ['createdAt', 'name', 'rating', 'deliveryFee'];
  const finalSort = sortable.includes(sortField) ? sortField : 'createdAt';

  const { count, rows } = await Restaurant.findAndCountAll({
    where,
    limit,
    offset,
    order: [[finalSort, sortOrder]],
    distinct: true
  });

  return { data: rows, meta: buildPageMeta(count, page, limit) };
};

export const getRestaurantById = async (id: number, opts?: { includeInactive?: boolean }) => {
  const restaurant = await Restaurant.findByPk(id);
  if (!restaurant) throw ApiError.notFound('Restaurant not found');
  if (opts?.includeInactive !== true && (!restaurant.isActive || restaurant.approvalStatus !== 'APPROVED')) {
    throw ApiError.notFound('Restaurant not found');
  }
  return restaurant;
};

export const createRestaurant = async (input: Record<string, unknown>) => {
  const baseSlug = slugify(String(input.name));
  let slug = baseSlug;
  let counter = 1;
  while (await Restaurant.findOne({ where: { slug } })) {
    slug = `${baseSlug}-${counter++}`;
  }
  return Restaurant.create({ ...(input as object), slug } as never);
};

export const updateRestaurant = async (id: number, input: Record<string, unknown>) => {
  const restaurant = await Restaurant.findByPk(id);
  if (!restaurant) throw ApiError.notFound('Restaurant not found');
  if (input.name && input.name !== restaurant.name) {
    restaurant.slug = slugify(String(input.name));
  }
  await restaurant.update({ ...input } as never);
  return restaurant;
};

export const updateRestaurantStatus = async (
  id: number,
  data: { approvalStatus?: string; isActive?: boolean }
) => {
  const restaurant = await Restaurant.findByPk(id);
  if (!restaurant) throw ApiError.notFound('Restaurant not found');
  await restaurant.update(data as never);
  return restaurant;
};

export const getUserRestaurantId = async (userId: number) => {
  const { RestaurantStaff } = await import('../models');
  const staff = await RestaurantStaff.findOne({ where: { userId } });
  if (!staff) throw ApiError.forbidden('No restaurant is linked to this account');
  return staff.restaurantId;
};