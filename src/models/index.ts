import { sequelize } from '../config/database';
import User from './User';
import Customer from './Customer';
import Restaurant from './Restaurant';
import RestaurantStaff from './RestaurantStaff';
import Rider from './Rider';
import Category from './Category';
import FoodItem from './FoodItem';
import Address from './Address';
import Order from './Order';
import OrderItem from './OrderItem';
import Payment from './Payment';
import Delivery from './Delivery';
import Notification from './Notification';
import OrderStatusHistory from './OrderStatusHistory';
import OrderRating from './OrderRating';

/** User -> role profiles */
User.hasOne(Customer, { foreignKey: 'userId', as: 'customer', onDelete: 'CASCADE' });
User.hasOne(RestaurantStaff, { foreignKey: 'userId', as: 'staff', onDelete: 'CASCADE' });
User.hasOne(Rider, { foreignKey: 'userId', as: 'rider', onDelete: 'CASCADE' });
Customer.belongsTo(User, { foreignKey: 'userId', as: 'user' });
RestaurantStaff.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Rider.belongsTo(User, { foreignKey: 'userId', as: 'user' });

/** User -> notifications */
User.hasMany(Notification, { foreignKey: 'userId', as: 'notifications', onDelete: 'CASCADE' });
Notification.belongsTo(User, { foreignKey: 'userId', as: 'user' });

/** Restaurant -> related entities */
Restaurant.hasMany(RestaurantStaff, { foreignKey: 'restaurantId', as: 'staffList', onDelete: 'CASCADE' });
Restaurant.hasMany(Rider, { foreignKey: 'restaurantId', as: 'riders' });
Restaurant.hasMany(Category, { foreignKey: 'restaurantId', as: 'categories', onDelete: 'CASCADE' });
Restaurant.hasMany(FoodItem, { foreignKey: 'restaurantId', as: 'foodItems', onDelete: 'CASCADE' });
Restaurant.hasMany(Order, { foreignKey: 'restaurantId', as: 'orders' });
RestaurantStaff.belongsTo(Restaurant, { foreignKey: 'restaurantId', as: 'restaurant' });
Rider.belongsTo(Restaurant, { foreignKey: 'restaurantId', as: 'restaurant' });

/** Category -> food items */
Category.belongsTo(Restaurant, { foreignKey: 'restaurantId', as: 'restaurant' });
Category.hasMany(FoodItem, { foreignKey: 'categoryId', as: 'foodItems', onDelete: 'CASCADE' });
FoodItem.belongsTo(Restaurant, { foreignKey: 'restaurantId', as: 'restaurant' });
FoodItem.belongsTo(Category, { foreignKey: 'categoryId', as: 'category' });

/** Customer -> addresses / orders */
Customer.hasMany(Address, { foreignKey: 'customerId', as: 'addresses', onDelete: 'CASCADE' });
Address.belongsTo(Customer, { foreignKey: 'customerId', as: 'customer' });
Customer.hasMany(Order, { foreignKey: 'customerId', as: 'orders' });

/** Orders */
Order.belongsTo(Customer, { foreignKey: 'customerId', as: 'customer' });
Order.belongsTo(Restaurant, { foreignKey: 'restaurantId', as: 'restaurant' });
Order.belongsTo(Rider, { foreignKey: 'riderId', as: 'rider', constraints: false });
Order.belongsTo(Address, { foreignKey: 'addressId', as: 'address', constraints: false });

Order.hasMany(OrderItem, { foreignKey: 'orderId', as: 'items', onDelete: 'CASCADE' });
OrderItem.belongsTo(Order, { foreignKey: 'orderId', as: 'order' });
OrderItem.belongsTo(FoodItem, { foreignKey: 'foodItemId', as: 'foodItem', constraints: false });

Order.hasOne(Payment, { foreignKey: 'orderId', as: 'payment', onDelete: 'CASCADE' });
Payment.belongsTo(Order, { foreignKey: 'orderId', as: 'order' });

Order.hasOne(Delivery, { foreignKey: 'orderId', as: 'delivery', onDelete: 'CASCADE' });
Delivery.belongsTo(Order, { foreignKey: 'orderId', as: 'order' });
Delivery.belongsTo(Rider, { foreignKey: 'riderId', as: 'rider', constraints: false });
Rider.hasMany(Delivery, { foreignKey: 'riderId', as: 'deliveries' });

Order.hasMany(OrderStatusHistory, { foreignKey: 'orderId', as: 'statusHistory', onDelete: 'CASCADE' });
OrderStatusHistory.belongsTo(Order, { foreignKey: 'orderId', as: 'order' });

Order.hasOne(OrderRating, { foreignKey: 'orderId', as: 'rating', onDelete: 'CASCADE' });
OrderRating.belongsTo(Order, { foreignKey: 'orderId', as: 'order' });

export const db = {
  sequelize,
  User,
  Customer,
  Restaurant,
  RestaurantStaff,
  Rider,
  Category,
  FoodItem,
  Address,
  Order,
  OrderItem,
  Payment,
  Delivery,
  Notification,
  OrderStatusHistory,
  OrderRating
};

export {
  User,
  Customer,
  Restaurant,
  RestaurantStaff,
  Rider,
  Category,
  FoodItem,
  Address,
  Order,
  OrderItem,
  Payment,
  Delivery,
  Notification,
  OrderStatusHistory,
  OrderRating
};