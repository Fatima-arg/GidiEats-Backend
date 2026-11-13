import { z } from 'zod';
import { paginationQuerySchema } from './restaurant.validators';
import { RIDER_AVAILABILITY } from '../config/constants';

export const updateRiderAvailabilitySchema = z.object({
  availabilityStatus: z.enum(Object.values(RIDER_AVAILABILITY) as [string, ...string[]])
});

export const addressQuerySchema = paginationQuerySchema;

export const createAddressSchema = z.object({
  label: z.string().trim().min(1).max(30).default('Home'),
  street: z.string().trim().min(3).max(160),
  city: z.string().trim().min(2).max(80),
  state: z.string().trim().min(2).max(50),
  postalCode: z.string().trim().max(20).optional(),
  phone: z.string().trim().min(6).max(20),
  isDefault: z.boolean().optional()
});

export const updateAddressSchema = createAddressSchema.partial();

export const addressParamsSchema = z.object({ id: z.coerce.number().int().positive() });

export const notificationsQuerySchema = paginationQuerySchema.extend({
  unread: z.enum(['true', 'false']).optional()
});