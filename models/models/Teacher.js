const sequelize = require("../db");
const Sequelize = require("sequelize");
const User = require("./User");

class Teacher extends Sequelize.Model {}
Teacher.init(
  {
    name: Sequelize.STRING(100),
    idNumber: Sequelize.STRING(100)
  },
  { sequelize, modelName: "Teacher" }
);

exports.createTeacher = async (password, idNumber, name) => {
  const user = await User.createUser(password, idNumber, ["teacher"], name);
  const teacher = await Teacher.create({
    name,
    idNumber
  });
  teacher.setUser(user);
  return teacher;
};

exports.getAll = () => {
  return Teacher.findAll({
    attributes: ["idNumber", "name", "UserUuid", "id"]
  });
};

exports.model = Teacher;
