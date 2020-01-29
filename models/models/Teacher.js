const sequelize = require("../db");
const Sequelize = require("sequelize");

class Teacher extends Sequelize.Model {}
Teacher.init(
  {
    name: Sequelize.STRING(100),
    idNumber: Sequelize.STRING(100),
    uuid: {
      type: Sequelize.STRING(100),
      unique: true,
      references: {
        model: "Users",
        key: "uuid"
      }
    }
  },
  { sequelize, modelName: "Teacher" }
);

module.exports = Teacher;
