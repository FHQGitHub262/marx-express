const path = require("path");
const sequelize = require("../db");
const Sequelize = require("sequelize");
const Util = require(path.resolve(__dirname, "../util"));

const Teacher = require("./Teacher");

class Subject extends Sequelize.Model {}
Subject.init(
  {
    name: Sequelize.STRING(100),
    id: {
      type: Sequelize.STRING(100),
      primaryKey: true,
      unique: true
    },
    majorNum: {
      type: Sequelize.INTEGER()
    }
  },
  { sequelize, modelName: "Subject" }
);

exports.create = name => {
  return Subject.create({
    name,
    id: Util.uuid(),
    majorNum: 0
  });
};

exports.getAll = () => {
  return Subject.findAll({
    // attributes: ["id", "name"]
  });
};

exports.getAllForTeacher = async teacherId => {
  const theTeacher = await Teacher.model.findOne({
    where: {
      UserUuid: teacherId
    }
  });
  const grantedCourse = await theTeacher.getCourses();
  const theSubject = await Subject.findAll({
    where: {
      id: {
        [Sequelize.Op.in]: Array.from(
          new Set(grantedCourse.map(item => item.dataValues.SubjectId))
        )
      }
    }
  });
  return theSubject;
};

exports.model = Subject;
