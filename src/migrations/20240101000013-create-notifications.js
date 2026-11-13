'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('notifications', {
      id: { type: Sequelize.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      user_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      title: { type: Sequelize.STRING(120), allowNull: false },
      message: { type: Sequelize.TEXT, allowNull: false },
      type: {
        type: Sequelize.ENUM('ORDER', 'PAYMENT', 'DELIVERY', 'SYSTEM'),
        allowNull: false,
        defaultValue: 'SYSTEM'
      },
      order_id: { type: Sequelize.INTEGER.UNSIGNED, allowNull: true },
      is_read: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false }
    });
    await queryInterface.addIndex('notifications', ['user_id'], { name: 'idx_notifications_user' });
    await queryInterface.addIndex('notifications', ['user_id', 'is_read'], {
      name: 'idx_notifications_user_read'
    });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('notifications');
  }
};