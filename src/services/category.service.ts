import { Op, WhereOptions } from 'sequelize';
import Category from '../models/Category';
import FoodItem from '../models/FoodItem';
import Restaurant from '../models/Restaurant';
import { ApiError } from '../utils/ApiError';
import { getPagination, buildPageMeta } from '../utils/pagination';

export const listCategories = async (query: { page?: number; limit?: number; search?: string; restaurantId?: number }) => {
  const { page, limit, offset } = getPagination(query.page, query.limit);
  const where: WhereOptions = {};
  if (query.restaurantId) where.restaurantId = query.restaurantId;
  if (query.search) where.name = { [Op.like]: `%${query.search}%` };

  const { count, rows } = await Category.findAndCountAll({
    where,
    limit,
    offset,
    order: [['sortOrder', 'ASC'], ['createdAt', 'DESC']],
    include: [{ model: Restaurant, as: 'restaurant', attributes: ['id', 'name'] }],
    distinct: true
  });
  return { data: rows, meta: buildPageMeta(count, page, limit) };
};

export const getCategory = async (id: number) => {
  const category = await Category.findByPk(id, {
    include: [{ model: Restaurant, as: 'restaurant', attributes: ['id', 'name'] }]
  });
  if (!category) throw ApiError.notFound('Category not found');
  return category;
};

export const createCategory = async (input: {
  restaurantId: number;
  name: string;
  description?: string;
  sortOrder?: number;
}) => {
  const restaurant = await Restaurant.findByPk(input.restaurantId);
  if (!restaurant) throw ApiError.notFound('Restaurant not found');
  const existing = await Category.findOne({
    where: { restaurantId: input.restaurantId, name: input.name }
  });
  if (existing) throw ApiError.conflict('A category with this name already exists');
  return Category.create({
    restaurantId: input.restaurantId,
    name: input.name,
    description: input.description ?? null,
    sortOrder: input.sortOrder ?? 0
  });
};

export const updateCategory = async (id: number, input: Record<string, unknown>) => {
  const category = await Category.findByPk(id);
  if (!category) throw ApiError.notFound('Category not found');
  if (input.name && input.name !== category.name) {
    const existing = await Category.findOne({
      where: { restaurantId: category.restaurantId, name: input.name }
    });
    if (existing) throw ApiError.conflict('A category with this name already exists');
  }
  await category.update(input as never);
  return category;
};

export const deleteCategory = async (id: number) => {
  const category = await Category.findByPk(id);
  if (!category) throw ApiError.notFound('Category not found');
  const itemCount = await FoodItem.count({ where: { categoryId: id } });
  if (itemCount > 0) {
    throw ApiError.conflict(
      `This category contains ${itemCount} food item(s). Move or delete them first.`
    );
  }
  await category.destroy();
  return { deleted: true };
};