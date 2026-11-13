import { createApp } from '../app';
import { signToken } from '../services/auth.service';
import {
  User,
  Customer,
  Restaurant,
  RestaurantStaff,
  Rider,
  Category,
  FoodItem,
  Address
} from '../models';
import { sequelize } from '../config/database';
import { ROLES } from '../config/constants';

export const app = createApp();

const TABLES_IN_DEPENDENCY_ORDER = [
  'notifications',
  'order_status_history',
  'order_ratings',
  'deliveries',
  'payments',
  'order_items',
  'orders',
  'addresses',
  'food_items',
  'categories',
  'restaurant_staff',
  'riders',
  'customers',
  'restaurants',
  'users'
];

export async function resetDb(): Promise<void> {
  const qi = sequelize.getQueryInterface();
  await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
  for (const table of TABLES_IN_DEPENDENCY_ORDER) {
    await qi.bulkDelete(table, {});
    await sequelize.query(`ALTER TABLE \`${table}\` AUTO_INCREMENT = 1`);
  }
  await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
}

export const password = (raw: string) => hashPassword(raw);

export async function hashPassword(raw: string): Promise<string> {
  const bcrypt = await import('bcryptjs');
  return bcrypt.hash(raw, 4);
}

interface UserSeed {
  user: User;
  token: string;
  profile: Customer | Rider | RestaurantStaff | null;
}

export interface BaseFixture {
  admin: UserSeed;
  customer: UserSeed;
  customerUser: User;
  customerProfile: Customer;
  customerAddress: Address;
  otherCustomer: UserSeed;
  staff: UserSeed;
  staffProfile: RestaurantStaff;
  otherStaff: UserSeed;
  otherStaffProfile: RestaurantStaff;
  rider: UserSeed;
  riderProfile: Rider;
  restaurant: Restaurant;
  otherRestaurant: Restaurant;
  category: Category;
  foodItem: FoodItem;
  foodItem2: FoodItem;
  otherFoodItem: FoodItem;
}

const now = new Date();
const later = new Date(Date.now() + 60_000);

export async function createBaseFixture(): Promise<BaseFixture> {
  const admin = await User.create({
    firstName: 'Adam',
    lastName: 'Admin',
    email: 'admin@gidieats.test',
    phone: '+2348000000001',
    passwordHash: await hashPassword('Demo@123'),
    role: ROLES.ADMIN
  });
  const customerUser = await User.create({
    firstName: 'Chip',
    lastName: 'Caretaker',
    email: 'customer@gidieats.test',
    phone: '+2348000000002',
    passwordHash: await hashPassword('Demo@123'),
    role: ROLES.CUSTOMER
  });
  const customer = await Customer.create({ userId: customerUser.id });

  const otherUser = await User.create({
    firstName: 'Cara',
    lastName: 'Other',
    email: 'other@gidieats.test',
    phone: '+2348000000003',
    passwordHash: await hashPassword('Demo@123'),
    role: ROLES.CUSTOMER
  });
  const otherCustomerProfile = await Customer.create({ userId: otherUser.id });

  const staffUser = await User.create({
    firstName: 'Steve',
    lastName: 'Staff',
    email: 'staff@gidieats.test',
    phone: '+2348000000004',
    passwordHash: await hashPassword('Demo@123'),
    role: ROLES.RESTAFF
  });
  const otherStaffUser = await User.create({
    firstName: 'Sally',
    lastName: 'OtherStaff',
    email: 'other-staff@gidieats.test',
    phone: '+2348000000009',
    passwordHash: await hashPassword('Demo@123'),
    role: ROLES.RESTAFF
  });
  const riderUser = await User.create({
    firstName: 'Rida',
    lastName: 'Rider',
    email: 'rider@gidieats.test',
    phone: '+2348000000005',
    passwordHash: await hashPassword('Demo@123'),
    role: ROLES.RIDER
  });

  const restaurant = await Restaurant.create({
    name: 'Test Kitchen',
    slug: 'test-kitchen',
    description: 'A restaurant used by the test suite.',
    phone: '+2348111111111',
    email: 'kitchen@gidieats.test',
    logo: '/uploads/test-logo.svg',
    coverImage: '/uploads/test-cover.svg',
    addressStreet: '1 Gwarzo Road',
    addressCity: 'BUK New Site',
    addressState: 'Kano',
    cuisineType: 'Continental',
    deliveryFee: 500,
    deliveryTimeMin: 30,
    opensAt: '08:00',
    closesAt: '22:00',
    rating: 4.2,
    ratingCount: 10,
    approvalStatus: 'APPROVED',
    isActive: true,
    createdAt: now,
    updatedAt: now
  });

  const otherRestaurant = await Restaurant.create({
    name: 'Other Kitchen',
    slug: 'other-kitchen',
    description: 'Second restaurant.',
    phone: '+2348222222222',
    email: 'other-kitchen@gidieats.test',
    addressStreet: '2 Danbare Campus Road',
    addressCity: 'Danbare',
    addressState: 'Kano',
    cuisineType: 'Nigerian',
    deliveryFee: 700,
    deliveryTimeMin: 40,
    approvalStatus: 'APPROVED',
    isActive: true,
    createdAt: now,
    updatedAt: later
  });

  const staff = await RestaurantStaff.create({
    userId: staffUser.id,
    restaurantId: restaurant.id,
    position: 'MANAGER',
    isPrimary: true
  });
  const otherStaff = await RestaurantStaff.create({
    userId: otherStaffUser.id,
    restaurantId: otherRestaurant.id,
    position: 'MANAGER',
    isPrimary: true
  });
  const rider = await Rider.create({ userId: riderUser.id, availabilityStatus: 'AVAILABLE' });

  const category = await Category.create({
    restaurantId: restaurant.id,
    name: 'Mains',
    description: 'Main dishes',
    sortOrder: 1,
    isActive: true
  });

  const foodItem = await FoodItem.create({
    restaurantId: restaurant.id,
    categoryId: category.id,
    name: 'Jollof Rice Special',
    description: 'Smoky party jollof with chicken.',
    price: 2500,
    image: '/uploads/jollof.svg',
    isAvailable: true,
    isFeatured: true,
    preparationTimeMin: 20,
    rating: 4.5,
    ratingCount: 8
  });
  const foodItem2 = await FoodItem.create({
    restaurantId: restaurant.id,
    categoryId: category.id,
    name: 'Pepper Soup',
    description: 'Spicy fish pepper soup.',
    price: 3000,
    image: '/uploads/pepper-soup.svg',
    isAvailable: true,
    isFeatured: false,
    preparationTimeMin: 15
  });
  const otherFoodItem = await FoodItem.create({
    restaurantId: otherRestaurant.id,
    categoryId: (await Category.create({ restaurantId: otherRestaurant.id, name: 'Drinks', sortOrder: 1 })).id,
    name: 'Chapman',
    description: 'Mocktail.',
    price: 1500,
    isAvailable: true
  });

  const customerAddress = await Address.create({
    customerId: customer.id,
    label: 'Home',
    street: '5 Test Street',
    city: 'BUK New Site',
    state: 'Kano',
    postalCode: '100001',
    phone: '+2348000000002',
    isDefault: true
  });

  const customerProfile = customer;

  return {
    admin: { user: admin, token: signToken(admin), profile: null },
    customer: { user: customerUser, token: signToken(customerUser), profile: customerProfile },
    customerUser,
    customerProfile,
    customerAddress,
    otherCustomer: { user: otherUser, token: signToken(otherUser), profile: otherCustomerProfile },
    staff: { user: staffUser, token: signToken(staffUser), profile: staff },
    staffProfile: staff,
    otherStaff: { user: otherStaffUser, token: signToken(otherStaffUser), profile: otherStaff },
    otherStaffProfile: otherStaff,
    rider: { user: riderUser, token: signToken(riderUser), profile: rider },
    riderProfile: rider,
    restaurant,
    otherRestaurant,
    category,
    foodItem,
    foodItem2,
    otherFoodItem
  };
}