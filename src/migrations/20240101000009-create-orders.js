'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('orders', {
      id: { type: Sequelize.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      order_number: { type: Sequelize.STRING(24), allowNull: false, unique: true },
      customer_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: 'customers', key: 'id' },
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE'
      },
      restaurant_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: 'restaurants', key: 'id' },
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE'
      },
      rider_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: true,
        references: { model: 'riders', key: 'id' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE'
      },
      address_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: true,
        references: { model: 'addresses', key: 'id' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE'
      },
      delivery_address: { type: Sequelize.TEXT, allowNull: true },
      status: {
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
        allowNull: false,
        defaultValue: 'PENDING'
      },
      subtotal: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
      delivery_fee: { type: Sequelize.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
      service_fee: { type: Sequelize.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
      discount: { type: Sequelize.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
      total: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
      payment_method: {
        type: Sequelize.ENUM('CARD', 'CASH', 'TRANSFER'),
        allowNull: false
      },
      special_instructions: { type: Sequelize.TEXT, allowNull: true },
      rejection_reason: { type: Sequelize.STRING(255), allowNull: true },
      cancel_reason: { type: Sequelize.STRING(255), allowNull: true },
      placed_at: { type: Sequelize.DATE, allowNull: false },
      confirmed_at: { type: Sequelize.DATE, allowNull: true },
      preparing_at: { type: Sequelize.DATE, allowNull: true },
      ready_at: { type: Sequelize.DATE, allowNull: true },
      rider_assigned_at: { type: Sequelize.DATE, allowNull: true },
      picked_up_at: { type: Sequelize.DATE, allowNull: true },
      delivered_at: { type: Sequelize.DATE, allowNull: true },
      rejected_at: { type: Sequelize.DATE, allowNull: true },
      cancelled_at: { type: Sequelize.DATE, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false }
    });
    await queryInterface.addIndex('orders', ['customer_id'], { name: 'idx_orders_customer' });
    await queryInterface.addIndex('orders', ['restaurant_id'], { name: 'idx_orders_restaurant' });
    await queryInterface.addIndex('orders', ['rider_id'], { name: 'idx_orders_rider' });
    await queryInterface.addIndex('orders', ['status'], { name: 'idx_orders_status' });
    await queryInterface.addIndex('orders', ['created_at'], { name: 'idx_orders_created' });
    await queryInterface.addIndex('orders', ['restaurant_id', 'status'], {
      name: 'idx_orders_restaurant_status'
    });
    await queryInterface.addIndex('orders', ['customer_id', 'created_at'], {
      name: 'idx_orders_customer_created'
    });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('orders');
  }
};