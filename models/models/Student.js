const sequelize = require("../db");
const Sequelize = require("sequelize");
const User = require("./User");

class Student extends Sequelize.Model {}
Student.init(
  {
    name: Sequelize.STRING(100),
    idNumber: Sequelize.STRING(100)
  },
  { sequelize, modelName: "Student" }
);

exports.createStudent = async (password, idNumber, name) => {
  const user = await User.createUser(password, idNumber, ["teacher"], name);
  const student = await Student.create({
    name,
    idNumber
  });
  student.setUser(user);
};

exports.getAll = async (config = {}) => {
  return await Student.findAll({ where: config });
};

exports.model = Student;
