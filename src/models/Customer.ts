import { Model, DataTypes, InferAttributes, InferCreationAttributes, CreationOptional } from 'sequelize';
import { sequelize } from '../config/database';
import User from './User';
import { PAYMENT_METHODS, PaymentMethod } from '../config/constants';

class Customer extends Model<InferAttributes<Customer>, InferCreationAttributes<Customer>> {
  declare id: CreationOptional<number>;
  declare userId: number;
  declare loyaltyPoints: CreationOptional<number>;
  declare totalOrders: CreationOptional<number>;
  declare totalSpend: CreationOptional<number>;
  declare preferredPaymentMethod: CreationOptional<PaymentMethod | null>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

Customer.init(
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    userId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, unique: true },
    loyaltyPoints: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    totalOrders: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    totalSpend: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
    preferredPaymentMethod: {
      type: DataTypes.ENUM(...Object.values(PAYMENT_METHODS)),
      allowNull: true,
      defaultValue: null
    },
    createdAt: { type: DataTypes.DATE, allowNull: false },
    updatedAt: { type: DataTypes.DATE, allowNull: false },
  },
  {
    sequelize,
    tableName: 'customers',
    timestamps: true,
    indexes: [{ fields: ['user_id'] }]
  }
);

export default Customer;