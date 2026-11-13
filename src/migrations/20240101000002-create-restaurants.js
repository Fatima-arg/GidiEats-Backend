'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('restaurants', {
      id: { type: Sequelize.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      name: { type: Sequelize.STRING(120), allowNull: false },
      slug: { type: Sequelize.STRING(140), allowNull: false, unique: true },
      description: { type: Sequelize.TEXT, allowNull: true },
      phone: { type: Sequelize.STRING(20), allowNull: false },
      email: { type: Sequelize.STRING(120), allowNull: true },
      address_street: { type: Sequelize.STRING(160), allowNull: false },
      address_city: { type: Sequelize.STRING(80), allowNull: false },
      address_state: { type: Sequelize.STRING(50), allowNull: false },
      logo: { type: Sequelize.STRING(255), allowNull: true },
      cover_image: { type: Sequelize.STRING(255), allowNull: true },
      cuisine_type: { type: Sequelize.STRING(80), allowNull: true },
      delivery_fee: { type: Sequelize.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
      delivery_time_min: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 30 },
      rating: { type: Sequelize.DECIMAL(3, 2), allowNull: false, defaultValue: 0 },
      rating_count: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      approval_status: {
        type: Sequelize.ENUM('PENDING', 'APPROVED', 'REJECTED'),
        allowNull: false,
        defaultValue: 'APPROVED'
      },
      is_active: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      opens_at: { type: Sequelize.STRING(5), allowNull: true },
      closes_at: { type: Sequelize.STRING(5), allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
      deleted_at: { type: Sequelize.DATE, allowNull: true }
    });
    await queryInterface.addIndex('restaurants', ['address_city'], { name: 'idx_restaurants_city' });
    await queryInterface.addIndex('restaurants', ['approval_status'], { name: 'idx_restaurants_approval' });
    await queryInterface.addIndex('restaurants', ['is_active'], { name: 'idx_restaurants_active' });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('restaurants');
  }
};