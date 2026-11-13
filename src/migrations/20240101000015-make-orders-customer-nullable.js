'use strict';

module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query('ALTER TABLE `orders` MODIFY `customer_id` INT UNSIGNED NULL');
  },
  async down(queryInterface) {
    await queryInterface.sequelize.query('ALTER TABLE `orders` MODIFY `customer_id` INT UNSIGNED NOT NULL');
  }
};