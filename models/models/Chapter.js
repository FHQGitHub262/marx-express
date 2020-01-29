const sequelize = require("../db");
const Sequelize = require("sequelize");

class Chapter extends Sequelize.Model {}
Chapter.init(
  {
    name: Sequelize.STRING(100),
    id: {
      type: Sequelize.STRING(100),
      primaryKey: true,
      unique: true
    }
  },
  { sequelize, modelName: "Chapter" }
);

module.exports = Chapter;
