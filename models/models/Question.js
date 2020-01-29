const sequelize = require("../db");
const Sequelize = require("sequelize");

class Question extends Sequelize.Model {}
Question.init(
  {
    id: {
      type: Sequelize.STRING(100),
      primaryKey: true,
      unique: true
    },
    title: Sequelize.STRING(100),
    right: Sequelize.STRING(10),
    enable: Sequelize.BOOLEAN,
    detail: Sequelize.TEXT,
    usage: Sequelize.BOOLEAN
  },
  { sequelize, modelName: "Question" }
);

module.exports = Question;
