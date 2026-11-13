import { Model, DataTypes, InferAttributes, InferCreationAttributes, CreationOptional } from 'sequelize';
import { sequelize } from '../config/database';
import { DELIVERY_STATUSES, DeliveryStatus } from '../config/constants';

class Delivery extends Model<InferAttributes<Delivery>, InferCreationAttributes<Delivery>> {
  declare id: CreationOptional<number>;
  declare orderId: number;
  declare riderId: CreationOptional<number | null>;
  declare status: CreationOptional<DeliveryStatus>;
  declare note: CreationOptional<string | null>;
  declare assignedAt: CreationOptional<Date>;
  declare acceptedAt: CreationOptional<Date | null>;
  declare pickedUpAt: CreationOptional<Date | null>;
  declare deliveredAt: CreationOptional<Date | null>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

Delivery.init(
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    orderId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, unique: true },
    riderId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true, defaultValue: null },
    status: {
      type: DataTypes.ENUM(...Object.values(DELIVERY_STATUSES)),
      allowNull: false,
      defaultValue: DELIVERY_STATUSES.ASSIGNED
    },
    note: { type: DataTypes.STRING(255), allowNull: true },
    assignedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    acceptedAt: { type: DataTypes.DATE, allowNull: true, defaultValue: null },
    pickedUpAt: { type: DataTypes.DATE, allowNull: true, defaultValue: null },
    deliveredAt: { type: DataTypes.DATE, allowNull: true, defaultValue: null },
    createdAt: { type: DataTypes.DATE, allowNull: false },
    updatedAt: { type: DataTypes.DATE, allowNull: false },
  },
  {
    sequelize,
    tableName: 'deliveries',
    timestamps: true,
    indexes: [
      { unique: true, fields: ['order_id'] },
      { fields: ['rider_id'] },
      { fields: ['status'] },
      { fields: ['rider_id', 'status'] }
    ]
  }
);

export default Delivery;