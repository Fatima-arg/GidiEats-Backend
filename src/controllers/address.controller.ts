import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { ok, created, noContent } from '../utils/response';
import * as addressService from '../services/address.service';

export const listAddresses = asyncHandler(async (req: Request, res: Response) => {
  ok(res, await addressService.listAddresses(req.user!.id));
});

export const createAddress = asyncHandler(async (req: Request, res: Response) => {
  created(res, await addressService.createAddress(req.user!.id, req.body), 'Address added');
});

export const updateAddress = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as unknown as { id: number };
  ok(res, await addressService.updateAddress(req.user!.id, id, req.body), { message: 'Address updated' });
});

export const deleteAddress = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as unknown as { id: number };
  await addressService.deleteAddress(req.user!.id, id);
  noContent(res);
});