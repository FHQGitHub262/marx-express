const sequelize = require("../db");
const Sequelize = require("sequelize");
const User = require("./User");

class Student extends Sequelize.Model {}
Student.init(
  {
    name: Sequelize.STRING(100),
    idNumber: { type: Sequelize.STRING(100), unique: true, primaryKey: true }
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

exports.getCourse = async studentId => {
  console.log(studentId);
  const theStudent = await Student.findOne({
    where: {
      UserUuid: studentId
    }
  });
  if (theStudent)
    return await theStudent.getCourses().map(item => item.dataValues);
  else return [];
};

exports.model = Student;
