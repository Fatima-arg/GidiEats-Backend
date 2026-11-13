import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { ok, created, noContent } from '../utils/response';
import * as foodItemService from '../services/food-item.service';
import { ApiError } from '../utils/ApiError';
import { ROLES } from '../config/constants';

const ensureCanMutate = async (req: Request, itemId?: number) => {
  const user = req.user!;
  if (user.role === ROLES.ADMIN) return;
  const { RestaurantStaff } = await import('../models');
  const staff = await RestaurantStaff.findOne({ where: { userId: user.id } });
  if (!staff) throw ApiError.forbidden('No restaurant linked to this account');
  if (itemId) {
    const item = await foodItemService.getFoodItem(itemId);
    if ((item as any).restaurantId !== staff.restaurantId) {
      throw ApiError.forbidden('You can only manage food items for your own restaurant');
    }
  }
};

export const listFoodItems = asyncHandler(async (req: Request, res: Response) => {
  const result = await foodItemService.listFoodItems(req.query as foodItemService.FoodItemQuery, { public: !req.user });
  ok(res, result.data, { meta: result.meta });
});

export const listFoodItemsPublic = asyncHandler(async (req: Request, res: Response) => {
  const result = await foodItemService.listFoodItems(req.query as foodItemService.FoodItemQuery, { public: true });
  ok(res, result.data, { meta: result.meta });
});

export const getFoodItem = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as unknown as { id: number };
  ok(res, await foodItemService.getFoodItem(id));
});

export const createFoodItem = asyncHandler(async (req: Request, res: Response) => {
  await ensureCanMutate(req);
  const imagePath = req.file ? `/uploads/${req.file.filename}` : null;
  const item = await foodItemService.createFoodItem(req.body, imagePath);
  created(res, item, 'Food item created');
});

export const updateFoodItem = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as unknown as { id: number };
  await ensureCanMutate(req, id);
  const imagePath = req.file ? `/uploads/${req.file.filename}` : undefined;
  const item = await foodItemService.updateFoodItem(id, req.body, imagePath);
  ok(res, item, { message: 'Food item updated' });
});

export const deleteFoodItem = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as unknown as { id: number };
  await ensureCanMutate(req, id);
  await foodItemService.deleteFoodItem(id);
  noContent(res);
});