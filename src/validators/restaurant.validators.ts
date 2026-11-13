import { z } from 'zod';

const idSchema = z.coerce.number().int().positive();

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  search: z.string().trim().max(120).optional(),
  sort: z.string().trim().max(60).optional(),
  order: z.enum(['ASC', 'DESC']).optional()
});

export const restaurantParamsSchema = z.object({
  id: idSchema
});

export const restaurantQuerySchema = paginationQuerySchema.extend({
  city: z.string().trim().max(80).optional(),
  cuisineType: z.string().trim().max(80).optional(),
  approvalStatus: z.enum(['PENDING', 'APPROVED', 'REJECTED']).optional(),
  includeInactive: z.enum(['true', 'false']).optional()
});

export const createRestaurantSchema = z.object({
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().max(2000).optional(),
  phone: z.string().trim().min(6).max(20),
  email: z.string().email().optional(),
  addressStreet: z.string().trim().min(3).max(160),
  addressCity: z.string().trim().min(2).max(80),
  addressState: z.string().trim().min(2).max(50),
  cuisineType: z.string().trim().max(80).optional(),
  deliveryFee: z.coerce.number().min(0).max(100000).optional(),
  deliveryTimeMin: z.coerce.number().int().min(5).max(240).optional(),
  opensAt: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Use HH:MM format').optional(),
  closesAt: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Use HH:MM format').optional(),
  logo: z.string().trim().max(20000).nullable().optional(),
  coverImage: z.string().trim().max(20000).nullable().optional(),
  rating: z.coerce.number().min(0).max(5).optional(),
  approvalStatus: z.enum(['PENDING', 'APPROVED', 'REJECTED']).optional(),
  isActive: z.boolean().optional()
});

export const updateRestaurantSchema = createRestaurantSchema.partial();

export const updateRestaurantStatusSchema = z.object({
  approvalStatus: z.enum(['PENDING', 'APPROVED', 'REJECTED']).optional(),
  isActive: z.boolean().optional()
});

export const menuParamsSchema = z.object({
  id: idSchema
});