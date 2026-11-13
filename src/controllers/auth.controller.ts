import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { ok, created } from '../utils/response';
import * as authService from '../services/auth.service';

export const register = asyncHandler(async (req: Request, res: Response) => {
  const user = await authService.registerCustomer(req.body);
  const token = authService.signToken(user);
  const data = await authService.getPublicUser(user);
  created(res, { token, user: data }, 'Account created successfully');
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const { token, user } = await authService.loginUser(email, password);
  const data = await authService.getPublicUser(user);
  ok(res, { token, user: data }, { message: 'Login successful' });
});

export const me = asyncHandler(async (req: Request, res: Response) => {
  const data = await authService.getPublicUser(req.user!);
  ok(res, data);
});