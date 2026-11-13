import { z } from 'zod';
import { paginationQuerySchema } from './restaurant.validators';

export const idParamsSchema = z.object({
  id: z.coerce.number().int().positive()
});

export const categoryQuerySchema = paginationQuerySchema.extend({
  restaurantId: z.coerce.number().int().positive().optional()
});

export const createCategorySchema = z.object({
  restaurantId: z.coerce.number().int().positive(),
  name: z.string().trim().min(2).max(80),
  description: z.string().trim().max(1000).optional(),
  sortOrder: z.coerce.number().int().min(0).optional()
});

export const updateCategorySchema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  description: z.string().trim().max(1000).nullable().optional(),
  sortOrder: z.coerce.number().int().min(0).optional(),
  isActive: z.boolean().optional()
});

export const foodItemQuerySchema = paginationQuerySchema.extend({
  restaurantId: z.coerce.number().int().positive().optional(),
  categoryId: z.coerce.number().int().positive().optional(),
  available: z.enum(['true', 'false']).optional(),
  featured: z.enum(['true', 'false']).optional()
});

export const createFoodItemSchema = z.object({
  restaurantId: z.coerce.number().int().positive(),
  categoryId: z.coerce.number().int().positive(),
  name: z.string().trim().min(2).max(100),
  description: z.string().trim().max(2000).optional(),
  price: z.coerce.number().min(1, 'Price must be greater than 0'),
  image: z.string().trim().max(20000).nullable().optional(),
  isAvailable: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  preparationTimeMin: z.coerce.number().int().min(1).max(240).optional()
});

export const updateFoodItemSchema = z.object({
  categoryId: z.coerce.number().int().positive().optional(),
  name: z.string().trim().min(2).max(100).optional(),
  description: z.string().trim().max(2000).nullable().optional(),
  price: z.coerce.number().min(1).optional(),
  image: z.string().trim().max(20000).nullable().optional(),
  isAvailable: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  preparationTimeMin: z.coerce.number().int().min(1).max(240).optional()
});