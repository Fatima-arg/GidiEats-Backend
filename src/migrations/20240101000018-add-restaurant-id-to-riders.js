'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const tableInfo = await queryInterface.describeTable('riders').catch(() => ({}));
    if (!tableInfo.restaurant_id) {
      await queryInterface.addColumn('riders', 'restaurant_id', {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: true,
        references: { model: 'restaurants', key: 'id' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE'
      });
      await queryInterface.addIndex('riders', ['restaurant_id'], { name: 'idx_riders_restaurant' });
    }
  },
  async down(queryInterface) {
    const tableInfo = await queryInterface.describeTable('riders').catch(() => ({}));
    if (tableInfo.restaurant_id) {
      await queryInterface.removeColumn('riders', 'restaurant_id');
    }
  }
};

