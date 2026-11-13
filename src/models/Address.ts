import { Model, DataTypes, InferAttributes, InferCreationAttributes, CreationOptional } from 'sequelize';
import { sequelize } from '../config/database';

class Address extends Model<InferAttributes<Address>, InferCreationAttributes<Address>> {
  declare id: CreationOptional<number>;
  declare customerId: number;
  declare label: CreationOptional<string>;
  declare street: string;
  declare city: string;
  declare state: string;
  declare postalCode: CreationOptional<string | null>;
  declare phone: string;
  declare isDefault: CreationOptional<boolean>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

Address.init(
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    customerId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    label: { type: DataTypes.STRING(30), allowNull: false, defaultValue: 'Home' },
    street: { type: DataTypes.STRING(160), allowNull: false },
    city: { type: DataTypes.STRING(80), allowNull: false },
    state: { type: DataTypes.STRING(50), allowNull: false },
    postalCode: { type: DataTypes.STRING(20), allowNull: true },
    phone: { type: DataTypes.STRING(20), allowNull: false },
    isDefault: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    createdAt: { type: DataTypes.DATE, allowNull: false },
    updatedAt: { type: DataTypes.DATE, allowNull: false },
  },
  {
    sequelize,
    tableName: 'addresses',
    timestamps: true,
    indexes: [{ fields: ['customer_id'] }]
  }
);

export default Address;