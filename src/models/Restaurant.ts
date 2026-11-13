import { Model, DataTypes, InferAttributes, InferCreationAttributes, CreationOptional } from 'sequelize';
import { sequelize } from '../config/database';

class Restaurant extends Model<InferAttributes<Restaurant>, InferCreationAttributes<Restaurant>> {
  declare id: CreationOptional<number>;
  declare name: string;
  declare slug: string;
  declare description: CreationOptional<string | null>;
  declare phone: string;
  declare email: CreationOptional<string | null>;
  declare addressStreet: string;
  declare addressCity: string;
  declare addressState: string;
  declare logo: CreationOptional<string | null>;
  declare coverImage: CreationOptional<string | null>;
  declare cuisineType: CreationOptional<string | null>;
  declare deliveryFee: CreationOptional<number>;
  declare deliveryTimeMin: CreationOptional<number>;
  declare rating: CreationOptional<number>;
  declare ratingCount: CreationOptional<number>;
  declare approvalStatus: CreationOptional<'PENDING' | 'APPROVED' | 'REJECTED'>;
  declare isActive: CreationOptional<boolean>;
  declare opensAt: CreationOptional<string | null>;
  declare closesAt: CreationOptional<string | null>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
  declare deletedAt: CreationOptional<Date | null>;
}

Restaurant.init(
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING(120), allowNull: false },
    slug: { type: DataTypes.STRING(140), allowNull: false, unique: true },
    description: { type: DataTypes.TEXT, allowNull: true },
    phone: { type: DataTypes.STRING(20), allowNull: false },
    email: { type: DataTypes.STRING(120), allowNull: true },
    addressStreet: { type: DataTypes.STRING(160), allowNull: false },
    addressCity: { type: DataTypes.STRING(80), allowNull: false },
    addressState: { type: DataTypes.STRING(50), allowNull: false },
    logo: { type: DataTypes.TEXT, allowNull: true },
    coverImage: { type: DataTypes.TEXT, allowNull: true },
    cuisineType: { type: DataTypes.STRING(80), allowNull: true },
    deliveryFee: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
    deliveryTimeMin: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 30 },
    rating: { type: DataTypes.DECIMAL(3, 2), allowNull: false, defaultValue: 0 },
    ratingCount: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    approvalStatus: {
      type: DataTypes.ENUM('PENDING', 'APPROVED', 'REJECTED'),
      allowNull: false,
      defaultValue: 'APPROVED'
    },
    isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    opensAt: { type: DataTypes.STRING(5), allowNull: true },
    closesAt: { type: DataTypes.STRING(5), allowNull: true },
    createdAt: { type: DataTypes.DATE, allowNull: false },
    updatedAt: { type: DataTypes.DATE, allowNull: false },
    deletedAt: { type: DataTypes.DATE, allowNull: true },
  },
  {
    sequelize,
    tableName: 'restaurants',
    timestamps: true,
    paranoid: true,
    indexes: [
      { unique: true, fields: ['slug'] },
      { fields: ['city'] },
      { fields: ['approval_status'] },
      { fields: ['is_active'] }
    ]
  }
);

export default Restaurant;