'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('order_status_history', {
      id: { type: Sequelize.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      order_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: 'orders', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      from_status: {
        type: Sequelize.ENUM(
          'PENDING',
          'CONFIRMED',
          'PREPARING',
          'READY_FOR_PICKUP',
          'RIDER_ASSIGNED',
          'PICKED_UP',
          'OUT_FOR_DELIVERY',
          'DELIVERED',
          'CANCELLED',
          'REJECTED'
        ),
        allowNull: true
      },
      to_status: {
        type: Sequelize.ENUM(
          'PENDING',
          'CONFIRMED',
          'PREPARING',
          'READY_FOR_PICKUP',
          'RIDER_ASSIGNED',
          'PICKED_UP',
          'OUT_FOR_DELIVERY',
          'DELIVERED',
          'CANCELLED',
          'REJECTED'
        ),
        allowNull: false
      },
      note: { type: Sequelize.STRING(255), allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false }
    });
    await queryInterface.addIndex('order_status_history', ['order_id'], {
      name: 'idx_status_history_order'
    });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('order_status_history');
  }
};