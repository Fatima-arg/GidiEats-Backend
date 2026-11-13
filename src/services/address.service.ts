import Address from '../models/Address';
import Customer from '../models/Customer';
import { ApiError } from '../utils/ApiError';

const getCustomer = async (userId: number) => {
  const customer = await Customer.findOne({ where: { userId } });
  if (!customer) throw ApiError.notFound('Customer profile not found');
  return customer;
};

export const listAddresses = async (userId: number) => {
  const customer = await getCustomer(userId);
  return Address.findAll({ where: { customerId: customer.id }, order: [['createdAt', 'DESC']] });
};

export const createAddress = async (userId: number, input: Record<string, unknown>) => {
  const customer = await getCustomer(userId);
  const isDefault = input.isDefault === true;
  if (isDefault) {
    await Address.update({ isDefault: false }, { where: { customerId: customer.id } });
  }
  const first = await Address.count({ where: { customerId: customer.id } });
  const address = await Address.create({
    customerId: customer.id,
    label: (input.label as string) ?? 'Home',
    street: input.street as string,
    city: input.city as string,
    state: input.state as string,
    postalCode: (input.postalCode as string) ?? null,
    phone: input.phone as string,
    isDefault: isDefault || first === 0
  });
  return address;
};

export const updateAddress = async (userId: number, id: number, input: Record<string, unknown>) => {
  const customer = await getCustomer(userId);
  const address = await Address.findOne({ where: { id, customerId: customer.id } });
  if (!address) throw ApiError.notFound('Address not found');

  if (input.isDefault === true) {
    await Address.update({ isDefault: false }, { where: { customerId: customer.id } });
  }
  await address.update(input as never);
  return address;
};

export const deleteAddress = async (userId: number, id: number) => {
  const customer = await getCustomer(userId);
  const address = await Address.findOne({ where: { id, customerId: customer.id } });
  if (!address) throw ApiError.notFound('Address not found');
  await address.destroy();
  return { deleted: true };
};