import { Model, DataTypes, InferAttributes, InferCreationAttributes, CreationOptional, NonAttribute } from 'sequelize';
import { sequelize } from '../config/database';
import { RIDER_AVAILABILITY, RiderAvailability, VEHICLE_TYPES, VehicleType } from '../config/constants';
import type Restaurant from './Restaurant';
import type User from './User';

class Rider extends Model<InferAttributes<Rider>, InferCreationAttributes<Rider>> {
  declare id: CreationOptional<number>;
  declare userId: number;
  declare restaurantId: CreationOptional<number | null>;
  declare vehicleType: CreationOptional<VehicleType>;
  declare licensePlate: CreationOptional<string | null>;
  declare availabilityStatus: CreationOptional<RiderAvailability>;
  declare totalDeliveries: CreationOptional<number>;
  declare rating: CreationOptional<number>;
  declare ratingCount: CreationOptional<number>;
  declare isActive: CreationOptional<boolean>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  declare user?: NonAttribute<User>;
  declare restaurant?: NonAttribute<Restaurant | null>;
}

Rider.init(
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    userId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, unique: true },
    restaurantId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
    vehicleType: {
      type: DataTypes.ENUM(...Object.values(VEHICLE_TYPES)),
      allowNull: false,
      defaultValue: VEHICLE_TYPES.MOTORCYCLE
    },
    licensePlate: { type: DataTypes.STRING(20), allowNull: true },
    availabilityStatus: {
      type: DataTypes.ENUM(...Object.values(RIDER_AVAILABILITY)),
      allowNull: false,
      defaultValue: RIDER_AVAILABILITY.AVAILABLE
    },
    totalDeliveries: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    rating: { type: DataTypes.DECIMAL(3, 2), allowNull: false, defaultValue: 0 },
    ratingCount: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    createdAt: { type: DataTypes.DATE, allowNull: false },
    updatedAt: { type: DataTypes.DATE, allowNull: false },
  },
  {
    sequelize,
    tableName: 'riders',
    timestamps: true,
    indexes: [
      { unique: true, fields: ['user_id'] },
      { fields: ['restaurant_id'] },
      { fields: ['availability_status'] }
    ]
  }
);

export default Rider;