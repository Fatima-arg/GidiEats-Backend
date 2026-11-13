'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('deliveries', {
      id: { type: Sequelize.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      order_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: 'orders', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
        unique: true
      },
      rider_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: true,
        references: { model: 'riders', key: 'id' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE'
      },
      status: {
        type: Sequelize.ENUM('ASSIGNED', 'ACCEPTED', 'PICKED_UP', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'),
        allowNull: false,
        defaultValue: 'ASSIGNED'
      },
      note: { type: Sequelize.STRING(255), allowNull: true },
      assigned_at: { type: Sequelize.DATE, allowNull: false },
      accepted_at: { type: Sequelize.DATE, allowNull: true },
      picked_up_at: { type: Sequelize.DATE, allowNull: true },
      delivered_at: { type: Sequelize.DATE, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false }
    });
    await queryInterface.addIndex('deliveries', ['rider_id'], { name: 'idx_deliveries_rider' });
    await queryInterface.addIndex('deliveries', ['status'], { name: 'idx_deliveries_status' });
    await queryInterface.addIndex('deliveries', ['rider_id', 'status'], {
      name: 'idx_deliveries_rider_status'
    });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('deliveries');
  }
};