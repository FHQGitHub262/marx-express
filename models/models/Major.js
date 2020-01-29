const sequelize = require("../db");
const Sequelize = require("sequelize");

class Major extends Sequelize.Model {}
Major.init(
  {
    name: Sequelize.STRING(100),
    id: {
      type: Sequelize.STRING(100),
      primaryKey: true,
      unique: true
    }
  },
  { sequelize, modelName: "Major" }
);

module.exports = Major;
