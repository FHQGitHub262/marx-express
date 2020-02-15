const path = require("path");
const sequelize = require("../db");
const Sequelize = require("sequelize");
const Util = require(path.resolve(__dirname, "../util"));

const Subject = require("./Subject");
const Student = require("./Student");
const Teacher = require("./Teacher");

const Op = Sequelize.Op;

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

exports.create = async (name, subjectId) => {
  const [course, subject] = await Promise.all([
    Course.create({
      name,
      status: "active",
      id: Util.uuid()
    }),
    Subject.model.findOne({
      where: {
        id: subjectId
      }
    })
  ]);
  await subject.setCourses([...(await subject.getCourses()), course]);
  return course;
};

exports.addStudents = async (courseId, studentList) => {
  const theCourse = await Course.findOne({
    where: {
      id: courseId
    }
  });
  const students = await Student.model.findAll({
    where: {
      id: {
        [Op.in]: studentList
      }
    }
  });
  return theCourse.setStudents(students);
};

exports.grantTo = async (courseId, teacherList) => {
  const theCourse = await Course.findOne({
    where: {
      id: courseId
    }
  });
  const teachers = await Teacher.model.findAll({
    where: {
      UserUuid: {
        [Op.in]: teacherList instanceof Array ? teacherList : [teacherList]
      }
    }
  });
  return theCourse.setTeachers(teachers);
};

exports.getAll = async subjectId => {
  const subject = await Subject.model.findOne({
    id: subjectId
  });
  console.log(subject);
  return subject.getCourses();
};

exports.model = Course;
