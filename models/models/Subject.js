const sequelize = require("../db");
const Sequelize = require("sequelize");

class Subject extends Sequelize.Model {}
Subject.init(
  {
    name: Sequelize.STRING(100),
    id: {
      type: Sequelize.STRING(100),
      primaryKey: true,
      unique: true
    }
  },
  { sequelize, modelName: "Subject" }
);

module.exports = Subject;
