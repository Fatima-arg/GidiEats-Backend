import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { ok, created, noContent } from '../utils/response';
import * as restaurantService from '../services/restaurant.service';
import { ApiError } from '../utils/ApiError';

export const listRestaurants = asyncHandler(async (req: Request, res: Response) => {
  const result = await restaurantService.listRestaurants(req.query);
  ok(res, result.data, { meta: result.meta });
});

export const getRestaurant = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as unknown as { id: number };
  const restaurant = await restaurantService.getRestaurantById(id, {
    includeInactive: req.query.includeInactive === 'true'
  });
  ok(res, restaurant);
});

export const createRestaurant = asyncHandler(async (req: Request, res: Response) => {
  const restaurant = await restaurantService.createRestaurant(req.body);
  created(res, restaurant, 'Restaurant created');
});

export const updateRestaurant = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as unknown as { id: number };
  const restaurant = await restaurantService.updateRestaurant(id, req.body);
  ok(res, restaurant, { message: 'Restaurant updated' });
});

export const updateRestaurantStatus = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as unknown as { id: number };
  const restaurant = await restaurantService.updateRestaurantStatus(id, req.body);
  ok(res, restaurant, { message: 'Restaurant status updated' });
});

export const getMenu = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as unknown as { id: number };
  const restaurant = await restaurantService.getRestaurantById(id);
  const [Category, FoodItem] = await Promise.all([
    import('../models/Category').then((m) => m.default),
    import('../models/FoodItem').then((m) => m.default)
  ]);
  const categories = await Category.findAll({
    where: { restaurantId: restaurant.id, isActive: true },
    order: [['sortOrder', 'ASC']],
    include: [
      {
        model: FoodItem,
        as: 'foodItems',
        where: { isAvailable: true },
        required: false
      }
    ]
  });
  const featured = await FoodItem.findAll({
    where: { restaurantId: restaurant.id, isFeatured: true, isAvailable: true },
    limit: 8
  });
  ok(res, { restaurant, categories, featured });
});