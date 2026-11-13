import { z } from 'zod';
import { ROLES, PAYMENT_METHODS, VEHICLE_TYPES } from '../config/constants';
import { paginationQuerySchema } from './restaurant.validators';

const nameSchema = z.string().trim().min(2, 'Name must be at least 2 characters').max(60);
const emailSchema = z.string().email('Invalid email address').transform((v) => v.toLowerCase().trim());
const phoneSchema = z.string().trim().min(6, 'Invalid phone number').max(20);

const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(100)
  .regex(/[a-zA-Z]/, 'Password must contain a letter')
  .regex(/[0-9]/, 'Password must contain a number');

export const registerSchema = z.object({
  firstName: nameSchema,
  lastName: nameSchema,
  email: emailSchema,
  phone: phoneSchema,
  password: passwordSchema
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address').transform((v) => v.toLowerCase().trim()),
  password: z.string().min(1, 'Password is required')
});

export const createUserSchema = z.object({
  firstName: nameSchema,
  lastName: nameSchema,
  email: emailSchema,
  phone: phoneSchema,
  password: passwordSchema,
  role: z.enum(Object.values(ROLES) as [string, ...string[]]).optional(),
  restaurantId: z.coerce.number().int().positive().nullable().optional().or(z.literal('').transform(() => null)),
  vehicleType: z.enum(Object.values(VEHICLE_TYPES) as [string, ...string[]]).optional(),
  licensePlate: z.string().trim().max(20).nullable().optional().or(z.literal('').transform(() => null)),
  position: z.enum(['MANAGER', 'CHEF', 'CASHIER', 'WAITER']).optional()
});

export const updateUserSchema = z.object({
  firstName: nameSchema.optional(),
  lastName: nameSchema.optional(),
  email: emailSchema.optional(),
  phone: phoneSchema.optional(),
  role: z.enum(Object.values(ROLES) as [string, ...string[]]).optional(),
  isActive: z.boolean().optional(),
  avatar: z.string().trim().max(20000).nullable().optional(),
  password: passwordSchema.optional().or(z.literal('')).transform((v) => (v ? v : undefined)),
  restaff: z
    .object({
      restaurantId: z.coerce.number().int().positive().nullable().optional().or(z.literal('').transform(() => null)),
      position: z.enum(['MANAGER', 'CHEF', 'CASHIER', 'WAITER']).optional()
    })
    .optional(),
  rider: z
    .object({
      vehicleType: z.enum(Object.values(VEHICLE_TYPES) as [string, ...string[]]).optional(),
      licensePlate: z.string().trim().max(20).nullable().optional().or(z.literal('').transform(() => null)),
      restaurantId: z.coerce.number().int().positive().nullable().optional().or(z.literal('').transform(() => null)),
      availabilityStatus: z.enum(['AVAILABLE', 'BUSY', 'OFFLINE']).optional(),
      isActive: z.boolean().optional()
    })
    .optional()
});

export const updateMeSchema = z.object({
  firstName: nameSchema.optional(),
  lastName: nameSchema.optional(),
  phone: phoneSchema.optional(),
  avatar: z.string().trim().max(20000).nullable().optional(),
  password: passwordSchema.optional()
});

export const userIdParamsSchema = z.object({
  id: z.coerce.number().int().positive()
});

export const updateUserStatusSchema = z.object({
  isActive: z.boolean()
});

export const userQuerySchema = paginationQuerySchema.extend({
  role: z.enum(Object.values(ROLES) as [string, ...string[]]).optional(),
  isActive: z.enum(['true', 'false']).optional()
});