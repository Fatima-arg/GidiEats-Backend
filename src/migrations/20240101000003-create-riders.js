'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('riders', {
      id: { type: Sequelize.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      user_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
        unique: true
      },
      restaurant_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: true,
        references: { model: 'restaurants', key: 'id' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE'
      },
      vehicle_type: {
        type: Sequelize.ENUM('MOTORCYCLE', 'BICYCLE', 'CAR'),
        allowNull: false,
        defaultValue: 'MOTORCYCLE'
      },
      license_plate: { type: Sequelize.STRING(20), allowNull: true },
      availability_status: {
        type: Sequelize.ENUM('AVAILABLE', 'BUSY', 'OFFLINE'),
        allowNull: false,
        defaultValue: 'AVAILABLE'
      },
      total_deliveries: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      rating: { type: Sequelize.DECIMAL(3, 2), allowNull: false, defaultValue: 0 },
      rating_count: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      is_active: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false }
    });
    await queryInterface.addIndex('riders', ['restaurant_id'], { name: 'idx_riders_restaurant' });
    await queryInterface.addIndex('riders', ['availability_status'], { name: 'idx_riders_availability' });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('riders');
  }
};