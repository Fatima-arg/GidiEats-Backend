import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { ok, created, noContent } from '../utils/response';
import * as categoryService from '../services/category.service';
import { ApiError } from '../utils/ApiError';
import { ROLES } from '../config/constants';

const ensureCanMutate = async (req: Request, categoryId?: number) => {
  const user = req.user!;
  if (user.role === ROLES.ADMIN) return;
  const { RestaurantStaff } = await import('../models');
  const staff = await RestaurantStaff.findOne({ where: { userId: user.id } });
  if (!staff) throw ApiError.forbidden('No restaurant linked to this account');

  if (categoryId) {
    const category = await categoryService.getCategory(categoryId);
    if (category.restaurantId !== staff.restaurantId) {
      throw ApiError.forbidden('You can only manage your own restaurant categories');
    }
  }
};

export const listCategories = asyncHandler(async (req: Request, res: Response) => {
  const result = await categoryService.listCategories(req.query);
  ok(res, result.data, { meta: result.meta });
});

export const getCategory = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as unknown as { id: number };
  ok(res, await categoryService.getCategory(id));
});

export const createCategory = asyncHandler(async (req: Request, res: Response) => {
  await ensureCanMutate(req);
  const category = await categoryService.createCategory(req.body);
  created(res, category, 'Category created');
});

export const updateCategory = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as unknown as { id: number };
  await ensureCanMutate(req, id);
  const category = await categoryService.updateCategory(id, req.body);
  ok(res, category, { message: 'Category updated' });
});

export const deleteCategory = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as unknown as { id: number };
  await ensureCanMutate(req, id);
  await categoryService.deleteCategory(id);
  noContent(res);
});