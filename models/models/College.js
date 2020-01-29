const sequelize = require("../db");
const Sequelize = require("sequelize");

class College extends Sequelize.Model {}
College.init(
  {
    name: Sequelize.STRING(100),
    id: {
      type: Sequelize.STRING(100),
      primaryKey: true,
      unique: true
    }
  },
  { sequelize, modelName: "College" }
);

module.exports = College;
