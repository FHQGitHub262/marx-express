const path = require("path");
const sequelize = require("../db");
const Sequelize = require("sequelize");
const Util = require(path.resolve(__dirname, "../util"));
const Major = require("./Major");
const Student = require("./Student");

const Op = Sequelize.Op;

class AdministrationClass extends Sequelize.Model { }
AdministrationClass.init(
  {
    name: Sequelize.STRING(100),
    id: {
      type: Sequelize.STRING(100),
      primaryKey: true,
      unique: true,
    },
  },
  { sequelize, modelName: "AdministrationClass" }
);

exports.createClass = async (name, majorId) => {
  const major = await Major.model.findOne({
    where: {
      id: majorId,
    },
  });

  return major.createAdministrationClass({
    name,
    id: Util.uuid(),
  });
};

exports.getAll = async (majorId) => {
  const major = await Major.model.findOne({
    where: {
      id: majorId,
    },
  });
  if (!major) {
    return [];
  }
  return major.getAdministrationClasses();
};

exports.addStudents = async (classId, studentList) => {
  const theClass = await AdministrationClass.findOne({
    where: {
      id: classId,
    },
  });
  const students = await Student.model.findAll({
    where: {
      UserUuid: {
        [Op.in]: studentList,
      },
    },
  });
  console.log(students)
  return theClass.setStudents(students);
};

exports.addStudent = async (classId, uuid) => {
  const theClass = await AdministrationClass.findOne({
    where: {
      id: classId,
    },
  });
  console.log(classId, uuid)
  const students = await Student.model.findOne({
    where: {
      UserUuid: uuid
    },
  });
  console.log(students)
  return theClass.addStudent(students);
};

exports.model = AdministrationClass;
