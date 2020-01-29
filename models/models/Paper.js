const sequelize = require("../db");
const Sequelize = require("sequelize");

class Paper extends Sequelize.Model {}
Paper.init(
  {
    name: Sequelize.STRING(100),
    type: Sequelize.BOOLEAN,
    id: {
      type: Sequelize.STRING(100),
      primaryKey: true,
      unique: true
    }
  },
  { sequelize, modelName: "Paper" }
);

module.exports = Paper;
