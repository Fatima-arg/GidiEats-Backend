'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('food_items', {
      id: { type: Sequelize.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      restaurant_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: 'restaurants', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      category_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: 'categories', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      name: { type: Sequelize.STRING(100), allowNull: false },
      description: { type: Sequelize.TEXT, allowNull: true },
      price: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
      image: { type: Sequelize.STRING(255), allowNull: true },
      is_available: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      is_featured: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      preparation_time_min: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 15 },
      rating: { type: Sequelize.DECIMAL(3, 2), allowNull: false, defaultValue: 0 },
      rating_count: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
      deleted_at: { type: Sequelize.DATE, allowNull: true }
    });
    await queryInterface.addIndex('food_items', ['restaurant_id'], { name: 'idx_food_restaurant' });
    await queryInterface.addIndex('food_items', ['category_id'], { name: 'idx_food_category' });
    await queryInterface.addIndex('food_items', ['restaurant_id', 'category_id'], {
      name: 'idx_food_restaurant_category'
    });
    await queryInterface.addIndex('food_items', ['is_available'], { name: 'idx_food_available' });
    await queryInterface.addIndex('food_items', ['is_featured'], { name: 'idx_food_featured' });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('food_items');
  }
};