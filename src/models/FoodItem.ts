import { Model, DataTypes, InferAttributes, InferCreationAttributes, CreationOptional } from 'sequelize';
import { sequelize } from '../config/database';

class FoodItem extends Model<InferAttributes<FoodItem>, InferCreationAttributes<FoodItem>> {
  declare id: CreationOptional<number>;
  declare restaurantId: number;
  declare categoryId: number;
  declare name: string;
  declare description: CreationOptional<string | null>;
  declare price: number;
  declare image: CreationOptional<string | null>;
  declare isAvailable: CreationOptional<boolean>;
  declare isFeatured: CreationOptional<boolean>;
  declare preparationTimeMin: CreationOptional<number>;
  declare rating: CreationOptional<number>;
  declare ratingCount: CreationOptional<number>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
  declare deletedAt: CreationOptional<Date | null>;
}

FoodItem.init(
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    restaurantId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    categoryId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    name: { type: DataTypes.STRING(100), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    price: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    image: { type: DataTypes.STRING(255), allowNull: true },
    isAvailable: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    isFeatured: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    preparationTimeMin: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 15 },
    rating: { type: DataTypes.DECIMAL(3, 2), allowNull: false, defaultValue: 0 },
    ratingCount: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    createdAt: { type: DataTypes.DATE, allowNull: false },
    updatedAt: { type: DataTypes.DATE, allowNull: false },
    deletedAt: { type: DataTypes.DATE, allowNull: true },
  },
  {
    sequelize,
    tableName: 'food_items',
    timestamps: true,
    paranoid: true,
    indexes: [
      { fields: ['restaurant_id'] },
      { fields: ['category_id'] },
      { fields: ['restaurant_id', 'category_id'] },
      { fields: ['is_available'] },
      { fields: ['is_featured'] }
    ]
  }
);

export default FoodItem;