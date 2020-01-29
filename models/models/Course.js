const sequelize = require("../db");
const Sequelize = require("sequelize");

class Course extends Sequelize.Model {}
Course.init(
  {
    name: Sequelize.STRING(100),
    id: {
      type: Sequelize.STRING(100),
      primaryKey: true,
      unique: true
    },
    status: Sequelize.STRING(10)
  },
  { sequelize, modelName: "Course" }
);

module.exports = Course;
