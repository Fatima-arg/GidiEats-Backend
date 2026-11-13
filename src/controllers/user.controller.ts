import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { ok, created } from '../utils/response';
import * as userService from '../services/user.service';
import { ROLES } from '../config/constants';
import { Rider } from '../models';
import { ApiError } from '../utils/ApiError';

export const listUsers = asyncHandler(async (req: Request, res: Response) => {
  const result = await userService.listUsers(req.query);
  ok(res, result.data, { meta: result.meta });
});

export const createUser = asyncHandler(async (req: Request, res: Response) => {
  const user = await userService.createUser(req.body);
  created(res, user, 'User created');
});

export const getUser = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as unknown as { id: number };
  ok(res, await userService.getPublicUserById(id));
});

export const updateUser = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as unknown as { id: number };
  ok(res, await userService.updateUser(id, req.body), { message: 'User updated' });
});

export const updateUserStatus = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as unknown as { id: number };
  ok(res, await userService.updateUserStatus(id, req.body.isActive), {
    message: 'User status updated'
  });
});

export const updateMe = asyncHandler(async (req: Request, res: Response) => {
  ok(res, await userService.updateUser(req.user!.id, req.body), { message: 'Profile updated' });
});

export const listAvailableRiders = asyncHandler(async (req: Request, res: Response) => {
  ok(res, await userService.listAvailableRiders());
});

export const listRiders = asyncHandler(async (req: Request, res: Response) => {
  const { User, Restaurant } = await import('../models');
  const riders = await Rider.findAll({
    include: [
      { model: User, as: 'user', attributes: ['id', 'firstName', 'lastName', 'phone', 'email'] },
      { model: Restaurant, as: 'restaurant', attributes: ['id', 'name', 'logo'] }
    ],
    order: [['createdAt', 'DESC']]
  });
  ok(res, riders);
});

export const getRider = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as unknown as { id: number };
  const { User, Restaurant } = await import('../models');
  const rider = await Rider.findByPk(id, {
    include: [
      { model: User, as: 'user', attributes: ['id', 'firstName', 'lastName', 'phone', 'email'] },
      { model: Restaurant, as: 'restaurant', attributes: ['id', 'name', 'logo'] }
    ]
  });
  if (!rider) throw ApiError.notFound('Rider not found');
  ok(res, rider);
});

export const updateRider = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as unknown as { id: number };
  const { User, Restaurant } = await import('../models');
  const rider = await Rider.findByPk(id, { include: [{ model: User, as: 'user' }] });
  if (!rider) throw ApiError.notFound('Rider not found');

  const { firstName, lastName, phone, email, ...riderFields } = req.body as Record<string, any>;
  if (firstName || lastName || phone || email) {
    const user = await User.findByPk(rider.userId);
    if (user) {
      const uPayload: any = {};
      if (firstName) uPayload.firstName = firstName.trim();
      if (lastName) uPayload.lastName = lastName.trim();
      if (phone) uPayload.phone = phone.trim();
      if (email && email.toLowerCase().trim() !== user.email) {
        const { Op } = await import('sequelize');
        const exist = await User.findOne({ where: { email: email.toLowerCase().trim(), id: { [Op.ne]: user.id } } });
        if (exist) throw ApiError.conflict('Email already in use');
        uPayload.email = email.toLowerCase().trim();
      }
      await user.update(uPayload);
    }
  }

  await rider.update(riderFields as never);
  const updated = await Rider.findByPk(id, {
    include: [
      { model: User, as: 'user', attributes: ['id', 'firstName', 'lastName', 'phone', 'email'] },
      { model: Restaurant, as: 'restaurant', attributes: ['id', 'name', 'logo'] }
    ]
  });
  ok(res, updated, { message: 'Rider updated' });
});

export const updateRiderAvailability = asyncHandler(async (req: Request, res: Response) => {
  const user = req.user!;
  const rider = await Rider.findOne({ where: { userId: user.id } });
  if (!rider) throw ApiError.notFound('Rider profile not found');
  await rider.update({ availabilityStatus: req.body.availabilityStatus });
  ok(res, rider, { message: 'Availability updated' });
});