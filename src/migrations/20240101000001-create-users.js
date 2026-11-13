'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('users', {
      id: { type: Sequelize.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      first_name: { type: Sequelize.STRING(60), allowNull: false },
      last_name: { type: Sequelize.STRING(60), allowNull: false },
      email: { type: Sequelize.STRING(120), allowNull: false, unique: true },
      phone: { type: Sequelize.STRING(20), allowNull: false },
      password_hash: { type: Sequelize.STRING(255), allowNull: false },
      role: {
        type: Sequelize.ENUM('CUSTOMER', 'RESTAFF', 'RIDER', 'ADMIN'),
        allowNull: false,
        defaultValue: 'CUSTOMER'
      },
      is_active: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      avatar: { type: Sequelize.STRING(255), allowNull: true },
      last_login_at: { type: Sequelize.DATE, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false }
    });
    await queryInterface.addIndex('users', ['role'], { name: 'idx_users_role' });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('users');
  }
};