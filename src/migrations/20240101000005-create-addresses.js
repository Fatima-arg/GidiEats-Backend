'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('addresses', {
      id: { type: Sequelize.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      customer_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: 'customers', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      label: { type: Sequelize.STRING(30), allowNull: false, defaultValue: 'Home' },
      street: { type: Sequelize.STRING(160), allowNull: false },
      city: { type: Sequelize.STRING(80), allowNull: false },
      state: { type: Sequelize.STRING(50), allowNull: false },
      postal_code: { type: Sequelize.STRING(20), allowNull: true },
      phone: { type: Sequelize.STRING(20), allowNull: false },
      is_default: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false }
    });
    await queryInterface.addIndex('addresses', ['customer_id'], { name: 'idx_addresses_customer' });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('addresses');
  }
};