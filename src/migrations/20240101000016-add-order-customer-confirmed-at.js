'use strict';

module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(
      'ALTER TABLE `orders` ADD COLUMN `customer_confirmed_at` DATETIME NULL AFTER `delivered_at`'
    );
  },
  async down(queryInterface) {
    await queryInterface.sequelize.query('ALTER TABLE `orders` DROP COLUMN `customer_confirmed_at`');
  }
};