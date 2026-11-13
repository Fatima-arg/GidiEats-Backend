import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { ROLES } from '../config/constants';
import { User, Customer, Rider, RestaurantStaff } from '../models';
import Restaurant from '../models/Restaurant';
import { ApiError } from '../utils/ApiError';
import { sanitizeUser } from '../utils/helpers';

const BCRYPT_ROUNDS = 10;

export const hashPassword = async (plain: string) => bcrypt.hash(plain, BCRYPT_ROUNDS);
export const comparePassword = async (plain: string, hash: string) => bcrypt.compare(plain, hash);

export const signToken = (user: User) =>
  jwt.sign({ id: user.id, email: user.email, role: user.role }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn as jwt.SignOptions['expiresIn']
  });

export const getPublicUser = async (user: User) => {
  const base = sanitizeUser(user.toJSON());
  const profile: Record<string, unknown> = { ...base };

  if (user.role === ROLES.CUSTOMER) {
    const customer = await Customer.findOne({ where: { userId: user.id } });
    if (customer) profile.customer = customer.toJSON();
  } else if (user.role === ROLES.RESTAFF) {
    const staff = await RestaurantStaff.findOne({
      where: { userId: user.id },
      include: [{ model: Restaurant, as: 'restaurant' }]
    });
    if (staff) profile.staff = staff.toJSON();
  } else if (user.role === ROLES.RIDER) {
    const rider = await Rider.findOne({ where: { userId: user.id } });
    if (rider) profile.rider = rider.toJSON();
  }
  return profile;
};

export const registerCustomer = async (input: {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
}) => {
  const existing = await User.findOne({ where: { email: input.email } });
  if (existing) throw ApiError.conflict('An account with this email already exists');

  const passwordHash = await hashPassword(input.password);
  const user = await User.create({
    firstName: input.firstName,
    lastName: input.lastName,
    email: input.email,
    phone: input.phone,
    passwordHash,
    role: ROLES.CUSTOMER
  });
  await Customer.create({ userId: user.id });
  return user;
};

export const loginUser = async (email: string, password: string) => {
  const user = await User.findOne({ where: { email } });
  if (!user) throw ApiError.unauthorized('Invalid email or password');

  const valid = await comparePassword(password, user.passwordHash);
  if (!valid) throw ApiError.unauthorized('Invalid email or password');

  if (!user.isActive) throw ApiError.forbidden('Your account has been deactivated');

  await user.update({ lastLoginAt: new Date() });
  return { token: signToken(user), user };
};