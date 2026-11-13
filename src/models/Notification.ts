import { Model, DataTypes, InferAttributes, InferCreationAttributes, CreationOptional } from 'sequelize';
import { sequelize } from '../config/database';
import { NOTIFICATION_TYPES, NotificationType } from '../config/constants';

class Notification extends Model<InferAttributes<Notification>, InferCreationAttributes<Notification>> {
  declare id: CreationOptional<number>;
  declare userId: number;
  declare title: string;
  declare message: string;
  declare type: CreationOptional<NotificationType>;
  declare orderId: CreationOptional<number | null>;
  declare isRead: CreationOptional<boolean>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

Notification.init(
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    userId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    title: { type: DataTypes.STRING(120), allowNull: false },
    message: { type: DataTypes.TEXT, allowNull: false },
    type: {
      type: DataTypes.ENUM(...Object.values(NOTIFICATION_TYPES)),
      allowNull: false,
      defaultValue: NOTIFICATION_TYPES.SYSTEM
    },
    orderId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
    isRead: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    createdAt: { type: DataTypes.DATE, allowNull: false },
    updatedAt: { type: DataTypes.DATE, allowNull: false },
  },
  {
    sequelize,
    tableName: 'notifications',
    timestamps: true,
    indexes: [{ fields: ['user_id'] }, { fields: ['user_id', 'is_read'] }, { fields: ['created_at'] }]
  }
);

export default Notification;