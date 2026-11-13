'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('payments', {
      id: { type: Sequelize.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      order_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: 'orders', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
        unique: true
      },
      amount: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
      method: { type: Sequelize.ENUM('CARD', 'CASH', 'TRANSFER'), allowNull: false },
      status: {
        type: Sequelize.ENUM('PENDING', 'SUCCESS', 'FAILED', 'REFUNDED'),
        allowNull: false,
        defaultValue: 'PENDING'
      },
      reference: { type: Sequelize.STRING(64), allowNull: false, unique: true },
      provider: { type: Sequelize.STRING(40), allowNull: false, defaultValue: 'GIDIPAY' },
      transaction_id: { type: Sequelize.STRING(80), allowNull: true },
      failure_reason: { type: Sequelize.STRING(255), allowNull: true },
      paid_at: { type: Sequelize.DATE, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false }
    });
    await queryInterface.addIndex('payments', ['status'], { name: 'idx_payments_status' });
    await queryInterface.addIndex('payments', ['method'], { name: 'idx_payments_method' });
    await queryInterface.addIndex('payments', ['created_at'], { name: 'idx_payments_created' });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('payments');
  }
};