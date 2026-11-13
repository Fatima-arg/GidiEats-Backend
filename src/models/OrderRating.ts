import { Model, DataTypes, InferAttributes, InferCreationAttributes, CreationOptional } from 'sequelize';
import { sequelize } from '../config/database';

class OrderRating extends Model<InferAttributes<OrderRating>, InferCreationAttributes<OrderRating>> {
  declare id: CreationOptional<number>;
  declare orderId: number;
  declare rating: number;
  declare deliveryRating: CreationOptional<number | null>;
  declare comment: CreationOptional<string | null>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

OrderRating.init(
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    orderId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, unique: true },
    rating: { type: DataTypes.TINYINT.UNSIGNED, allowNull: false },
    deliveryRating: { type: DataTypes.TINYINT.UNSIGNED, allowNull: true },
    comment: { type: DataTypes.STRING(500), allowNull: true },
    createdAt: { type: DataTypes.DATE, allowNull: false },
    updatedAt: { type: DataTypes.DATE, allowNull: false }
  },
  {
    sequelize,
    tableName: 'order_ratings',
    timestamps: true,
    indexes: [{ fields: ['order_id'] }]
  }
);

export default OrderRating;