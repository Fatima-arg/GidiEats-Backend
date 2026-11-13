'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('order_ratings', {
      id: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, autoIncrement: true, primaryKey: true },
      order_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        unique: true,
        references: { model: 'orders', key: 'id' },
        onDelete: 'CASCADE'
      },
      rating: { type: Sequelize.TINYINT.UNSIGNED, allowNull: false },
      delivery_rating: { type: Sequelize.TINYINT.UNSIGNED, allowNull: true },
      comment: { type: Sequelize.STRING(500), allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false }
    });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('order_ratings');
  }
};