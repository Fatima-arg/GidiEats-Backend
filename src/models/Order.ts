import { Model, DataTypes, InferAttributes, InferCreationAttributes, CreationOptional } from 'sequelize';
import { sequelize } from '../config/database';
import { ORDER_STATUSES, OrderStatus, PAYMENT_METHODS, PaymentMethod } from '../config/constants';

export interface DeliveryAddressSnapshot {
  name: string;
  phone: string;
  street: string;
  city: string;
  state: string;
}

class Order extends Model<InferAttributes<Order>, InferCreationAttributes<Order>> {
  declare id: CreationOptional<number>;
  declare orderNumber: string;
  declare customerId: number | null;
  declare restaurantId: number;
  declare riderId: CreationOptional<number | null>;
  declare addressId: CreationOptional<number | null>;
  declare deliveryAddress: CreationOptional<string | null>;
  declare status: CreationOptional<OrderStatus>;
  declare subtotal: number;
  declare deliveryFee: CreationOptional<number>;
  declare serviceFee: CreationOptional<number>;
  declare discount: CreationOptional<number>;
  declare total: number;
  declare paymentMethod: PaymentMethod;
  declare specialInstructions: CreationOptional<string | null>;
  declare rejectionReason: CreationOptional<string | null>;
  declare cancelReason: CreationOptional<string | null>;
  declare placedAt: CreationOptional<Date>;
  declare confirmedAt: CreationOptional<Date | null>;
  declare preparingAt: CreationOptional<Date | null>;
  declare readyAt: CreationOptional<Date | null>;
  declare riderAssignedAt: CreationOptional<Date | null>;
  declare pickedUpAt: CreationOptional<Date | null>;
  declare deliveredAt: CreationOptional<Date | null>;
  declare customerConfirmedAt: CreationOptional<Date | null>;
  declare rejectedAt: CreationOptional<Date | null>;
  declare cancelledAt: CreationOptional<Date | null>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

Order.init(
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    orderNumber: { type: DataTypes.STRING(24), allowNull: false, unique: true },
    customerId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true, defaultValue: null },
    restaurantId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    riderId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true, defaultValue: null },
    addressId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true, defaultValue: null },
    deliveryAddress: { type: DataTypes.TEXT, allowNull: true },
    status: {
      type: DataTypes.ENUM(...Object.values(ORDER_STATUSES)),
      allowNull: false,
      defaultValue: ORDER_STATUSES.PENDING
    },
    subtotal: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    deliveryFee: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
    serviceFee: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
    discount: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
    total: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    paymentMethod: {
      type: DataTypes.ENUM(...Object.values(PAYMENT_METHODS)),
      allowNull: false
    },
    specialInstructions: { type: DataTypes.TEXT, allowNull: true },
    rejectionReason: { type: DataTypes.STRING(255), allowNull: true },
    cancelReason: { type: DataTypes.STRING(255), allowNull: true },
    placedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    confirmedAt: { type: DataTypes.DATE, allowNull: true, defaultValue: null },
    preparingAt: { type: DataTypes.DATE, allowNull: true, defaultValue: null },
    readyAt: { type: DataTypes.DATE, allowNull: true, defaultValue: null },
    riderAssignedAt: { type: DataTypes.DATE, allowNull: true, defaultValue: null },
    pickedUpAt: { type: DataTypes.DATE, allowNull: true, defaultValue: null },
    deliveredAt: { type: DataTypes.DATE, allowNull: true, defaultValue: null },
    customerConfirmedAt: { type: DataTypes.DATE, allowNull: true, defaultValue: null },
    rejectedAt: { type: DataTypes.DATE, allowNull: true, defaultValue: null },
    cancelledAt: { type: DataTypes.DATE, allowNull: true, defaultValue: null },
    createdAt: { type: DataTypes.DATE, allowNull: false },
    updatedAt: { type: DataTypes.DATE, allowNull: false },
  },
  {
    sequelize,
    tableName: 'orders',
    timestamps: true,
    indexes: [
      { unique: true, fields: ['order_number'] },
      { fields: ['customer_id'] },
      { fields: ['restaurant_id'] },
      { fields: ['rider_id'] },
      { fields: ['status'] },
      { fields: ['created_at'] },
      { fields: ['restaurant_id', 'status'] },
      { fields: ['customer_id', 'created_at'] }
    ]
  }
);

export default Order;