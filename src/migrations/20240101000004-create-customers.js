'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('customers', {
      id: { type: Sequelize.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      user_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
        unique: true
      },
      loyalty_points: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      total_orders: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      total_spend: { type: Sequelize.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
      preferred_payment_method: {
        type: Sequelize.ENUM('CARD', 'CASH', 'TRANSFER'),
        allowNull: true
      },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false }
    });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('customers');
  }
};