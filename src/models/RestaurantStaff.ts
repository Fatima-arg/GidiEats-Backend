import { Model, DataTypes, InferAttributes, InferCreationAttributes, CreationOptional } from 'sequelize';
import { sequelize } from '../config/database';

class RestaurantStaff extends Model<InferAttributes<RestaurantStaff>, InferCreationAttributes<RestaurantStaff>> {
  declare id: CreationOptional<number>;
  declare userId: number;
  declare restaurantId: number;
  declare position: CreationOptional<'MANAGER' | 'CHEF' | 'CASHIER' | 'WAITER'>;
  declare isPrimary: CreationOptional<boolean>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

RestaurantStaff.init(
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    userId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, unique: true },
    restaurantId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    position: {
      type: DataTypes.ENUM('MANAGER', 'CHEF', 'CASHIER', 'WAITER'),
      allowNull: false,
      defaultValue: 'MANAGER'
    },
    isPrimary: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    createdAt: { type: DataTypes.DATE, allowNull: false },
    updatedAt: { type: DataTypes.DATE, allowNull: false },
  },
  {
    sequelize,
    tableName: 'restaurant_staff',
    timestamps: true,
    indexes: [
      { unique: true, fields: ['user_id'] },
      { fields: ['restaurant_id'] }
    ]
  }
);

export default RestaurantStaff;