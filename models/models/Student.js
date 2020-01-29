const sequelize = require("../db");
const Sequelize = require("sequelize");

class Student extends Sequelize.Model {}
Student.init(
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
  { sequelize, modelName: "Student" }
);

module.exports = Student;
