import { Model, DataTypes, InferAttributes, InferCreationAttributes, CreationOptional } from 'sequelize';
import { sequelize } from '../config/database';
import { PAYMENT_METHODS, PAYMENT_STATUSES, PaymentMethod, PaymentStatus } from '../config/constants';

class Payment extends Model<InferAttributes<Payment>, InferCreationAttributes<Payment>> {
  declare id: CreationOptional<number>;
  declare orderId: number;
  declare amount: number;
  declare method: PaymentMethod;
  declare status: CreationOptional<PaymentStatus>;
  declare reference: string;
  declare provider: CreationOptional<string>;
  declare transactionId: CreationOptional<string | null>;
  declare failureReason: CreationOptional<string | null>;
  declare paidAt: CreationOptional<Date | null>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

Payment.init(
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    orderId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, unique: true },
    amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    method: {
      type: DataTypes.ENUM(...Object.values(PAYMENT_METHODS)),
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM(...Object.values(PAYMENT_STATUSES)),
      allowNull: false,
      defaultValue: PAYMENT_STATUSES.PENDING
    },
    reference: { type: DataTypes.STRING(64), allowNull: false, unique: true },
    provider: { type: DataTypes.STRING(40), allowNull: false, defaultValue: 'GIDIPAY' },
    transactionId: { type: DataTypes.STRING(80), allowNull: true },
    failureReason: { type: DataTypes.STRING(255), allowNull: true },
    paidAt: { type: DataTypes.DATE, allowNull: true, defaultValue: null },
    createdAt: { type: DataTypes.DATE, allowNull: false },
    updatedAt: { type: DataTypes.DATE, allowNull: false },
  },
  {
    sequelize,
    tableName: 'payments',
    timestamps: true,
    indexes: [
      { unique: true, fields: ['order_id'] },
      { unique: true, fields: ['reference'] },
      { fields: ['status'] },
      { fields: ['method'] },
      { fields: ['created_at'] }
    ]
  }
);

export default Payment;