const sequelize = require("../db");
const Sequelize = require("sequelize");

class Exam extends Sequelize.Model {}
Exam.init(
  {
    name: Sequelize.STRING(100),
    id: {
      type: Sequelize.STRING(100),
      primaryKey: true,
      unique: true
    },
    startAt: Sequelize.BIGINT,
    endAt: Sequelize.BIGINT,
    usage: Sequelize.BOOLEAN
  },
  { sequelize, modelName: "Exam" }
);

module.exports = Exam;
