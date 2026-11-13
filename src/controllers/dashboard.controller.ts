import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { ok } from '../utils/response';
import * as dashboardService from '../services/dashboard.service';
import { ROLES } from '../config/constants';

export const getAdminDashboard = asyncHandler(async (req: Request, res: Response) => {
  ok(res, await dashboardService.getAdminDashboard());
});

export const getRestaurantDashboard = asyncHandler(async (req: Request, res: Response) => {
  ok(res, await dashboardService.getRestaurantDashboard(req.user!.id));
});

export const getRiderDashboard = asyncHandler(async (req: Request, res: Response) => {
  ok(res, await dashboardService.getRiderDashboard(req.user!.id));
});

export const getReports = asyncHandler(async (req: Request, res: Response) => {
  ok(res, await dashboardService.adminReports());
});

export const getDashboard = asyncHandler(async (req: Request, res: Response) => {
  const role = req.user!.role;
  if (role === ROLES.ADMIN) return ok(res, await dashboardService.getAdminDashboard());
  if (role === ROLES.RESTAFF) return ok(res, await dashboardService.getRestaurantDashboard(req.user!.id));
  if (role === ROLES.RIDER) return ok(res, await dashboardService.getRiderDashboard(req.user!.id));
  ok(res, { role, counts: {} });
});