import { Model, DataTypes, InferAttributes, InferCreationAttributes, CreationOptional } from 'sequelize';
import { sequelize } from '../config/database';
import { ORDER_STATUSES } from '../config/constants';

class OrderStatusHistory extends Model<
  InferAttributes<OrderStatusHistory>,
  InferCreationAttributes<OrderStatusHistory>
> {
  declare id: CreationOptional<number>;
  declare orderId: number;
  declare fromStatus: CreationOptional<string | null>;
  declare toStatus: string;
  declare note: CreationOptional<string | null>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

OrderStatusHistory.init(
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    orderId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    fromStatus: { type: DataTypes.ENUM(...Object.values(ORDER_STATUSES)), allowNull: true },
    toStatus: { type: DataTypes.ENUM(...Object.values(ORDER_STATUSES)), allowNull: false },
    note: { type: DataTypes.STRING(255), allowNull: true },
    createdAt: { type: DataTypes.DATE, allowNull: false },
    updatedAt: { type: DataTypes.DATE, allowNull: false },
  },
  {
    sequelize,
    tableName: 'order_status_history',
    timestamps: true,
    indexes: [{ fields: ['order_id'] }, { fields: ['created_at'] }]
  }
);

export default OrderStatusHistory;