import { Op, WhereOptions } from 'sequelize';
import FoodItem from '../models/FoodItem';
import Category from '../models/Category';
import Restaurant from '../models/Restaurant';
import { ApiError } from '../utils/ApiError';
import { getPagination, buildPageMeta } from '../utils/pagination';

export interface FoodItemQuery {
  page?: number;
  limit?: number;
  search?: string;
  restaurantId?: number;
  categoryId?: number;
  available?: string;
  featured?: string;
  sort?: string;
  order?: 'ASC' | 'DESC';
}

export const listFoodItems = async (query: FoodItemQuery, opts?: { public?: boolean }) => {
  const { page, limit, offset } = getPagination(query.page, query.limit);
  const where: WhereOptions = {};
  const restaurantWhere: WhereOptions = {};

  if (query.restaurantId) where.restaurantId = query.restaurantId;
  if (query.categoryId) where.categoryId = query.categoryId;
  if (query.search) {
    where.name = { [Op.like]: `%${query.search}%` };
  }
  if (query.available === 'true') where.isAvailable = true;
  if (query.featured === 'true') where.isFeatured = true;
  if (opts?.public) {
    where.isAvailable = true;
    restaurantWhere.isActive = true;
    restaurantWhere.approvalStatus = 'APPROVED';
  }

  const sortField = ['name', 'price', 'rating', 'createdAt'].includes(query.sort ?? '')
    ? (query.sort as string)
    : 'createdAt';
  const sortOrder = query.order ?? 'DESC';

  const { count, rows } = await FoodItem.findAndCountAll({
    where,
    limit,
    offset,
    order: [[sortField, sortOrder]],
    include: [
      { model: Category, as: 'category', attributes: ['id', 'name'] },
      {
        model: Restaurant,
        as: 'restaurant',
        attributes: ['id', 'name', 'deliveryFee', 'deliveryTimeMin'],
        where: Object.keys(restaurantWhere).length ? restaurantWhere : undefined
      }
    ],
    distinct: true
  });

  return { data: rows, meta: buildPageMeta(count, page, limit) };
};

export const getFoodItem = async (id: number) => {
  const item = await FoodItem.findByPk(id, {
    include: [
      { model: Category, as: 'category', attributes: ['id', 'name'] },
      { model: Restaurant, as: 'restaurant', attributes: ['id', 'name', 'deliveryFee', 'deliveryTimeMin'] }
    ]
  });
  if (!item) throw ApiError.notFound('Food item not found');
  return item;
};

export const createFoodItem = async (input: Record<string, unknown>, image?: string | null) => {
  const [category, restaurant] = await Promise.all([
    Category.findByPk(Number(input.categoryId)),
    Restaurant.findByPk(Number(input.restaurantId))
  ]);
  if (!restaurant) throw ApiError.notFound('Restaurant not found');
  if (!category) throw ApiError.notFound('Category not found');
  if (category.restaurantId !== Number(input.restaurantId)) {
    throw ApiError.badRequest('Category does not belong to this restaurant');
  }
  return FoodItem.create({
    restaurantId: Number(input.restaurantId),
    categoryId: Number(input.categoryId),
    name: String(input.name),
    description: (input.description as string) ?? null,
    price: Number(input.price),
    image: image ?? null,
    isAvailable: input.isAvailable !== undefined ? Boolean(input.isAvailable) : true,
    isFeatured: input.isFeatured !== undefined ? Boolean(input.isFeatured) : false,
    preparationTimeMin: input.preparationTimeMin ? Number(input.preparationTimeMin) : 15
  });
};

export const updateFoodItem = async (id: number, input: Record<string, unknown>, image?: string | null) => {
  const item = await FoodItem.findByPk(id);
  if (!item) throw ApiError.notFound('Food item not found');

  if (input.categoryId) {
    const category = await Category.findByPk(Number(input.categoryId));
    if (!category) throw ApiError.notFound('Category not found');
    if (category.restaurantId !== item.restaurantId) {
      throw ApiError.badRequest('Category does not belong to this restaurant');
    }
  }

  const payload: Record<string, unknown> = { ...input };
  if (image) payload.image = image;
  await item.update(payload as never);
  return item;
};

export const deleteFoodItem = async (id: number) => {
  const item = await FoodItem.findByPk(id);
  if (!item) throw ApiError.notFound('Food item not found');
  await item.destroy();
  return { deleted: true };
};