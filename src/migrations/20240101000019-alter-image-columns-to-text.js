'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn('food_items', 'image', {
      type: Sequelize.TEXT,
      allowNull: true
    });
    await queryInterface.changeColumn('restaurants', 'logo', {
      type: Sequelize.TEXT,
      allowNull: true
    });
    await queryInterface.changeColumn('restaurants', 'cover_image', {
      type: Sequelize.TEXT,
      allowNull: true
    });
    await queryInterface.changeColumn('users', 'avatar', {
      type: Sequelize.TEXT,
      allowNull: true
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn('users', 'avatar', {
      type: Sequelize.STRING(255),
      allowNull: true
    });
    await queryInterface.changeColumn('food_items', 'image', {
      type: Sequelize.STRING(255),
      allowNull: true
    });
    await queryInterface.changeColumn('restaurants', 'logo', {
      type: Sequelize.STRING(255),
      allowNull: true
    });
    await queryInterface.changeColumn('restaurants', 'cover_image', {
      type: Sequelize.STRING(255),
      allowNull: true
    });
  }
};
