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
      unique: true,
    },
    status: Sequelize.STRING(10),
  },
  { sequelize, modelName: "Course" }
);

exports.create = async (name, subjectId) => {
  const [course, subject] = await Promise.all([
    Course.create({
      name,
      status: "active",
      id: Util.uuid(),
    }),
    Subject.model.findOne({
      where: {
        id: subjectId,
      },
    }),
  ]);
  await subject.setCourses([...(await subject.getCourses()), course]);
  return course;
};

exports.detail = async (id) => {
  const theCourse = await Course.findOne({ where: { id } });
  const [teacher, students] = await Promise.all([
    theCourse.getTeachers(),
    theCourse.getStudents(),
  ]);

  return {
    teacher: teacher.map((item) => item.dataValues.UserUuid),
    students: students.map((item) => item.dataValues.UserUuid),
  };
};

exports.addStudents = async (courseId, studentList) => {
  const theCourse = await Course.findOne({
    where: {
      id: courseId,
    },
  });
  const students = await Student.model.findAll({
    where: {
      UserUuid: {
        [Op.in]: studentList,
      },
    },
  });
  return theCourse.setStudents(students);
};

exports.grantTo = async (courseId, teacherList) => {
  const theCourse = await Course.findOne({
    where: {
      id: courseId,
    },
  });
  const teachers = await Teacher.model.findAll({
    where: {
      UserUuid: {
        [Op.in]: teacherList instanceof Array ? teacherList : [teacherList],
      },
    },
  });
  return theCourse.addTeachers(teachers);
};

exports.grantBatchTo = async (courseIds, teacherList) => {
  const theCourses = await Course.findAll({
    where: {
      id: {
        [Sequelize.Op.in]: courseIds,
      },
    },
  });
  const teachers = await Teacher.model.findAll({
    where: {
      UserUuid: {
        [Op.in]: teacherList instanceof Array ? teacherList : [teacherList],
      },
    },
  });
  return theCourses.map((item) => item.addTeachers(teachers));
};

exports.getAll = async (subjectId) => {
  const subject = await Subject.model.findOne({
    where: {
      id: subjectId,
    },
  });
  // console.log(subject);
  return subject.getCourses();
};

exports.getAllForTeacher = async (subjectId, teacherId) => {
  const subject = await Subject.model.findOne({
    where: {
      id: subjectId,
    },
  });
  const theTeacher = await Teacher.model.findOne({
    where: {
      UserUuid: teacherId,
    },
  });
  const teacherOwns = (await theTeacher.getCourses()).map(
    (item) => item.dataValues.GrantCourse.CourseId
  );
  return subject.getCourses({
    where: {
      id: {
        [Sequelize.Op.in]: teacherOwns,
      },
    },
  });
};

exports.getExams = async (courseId) => {
  const theCourse = await Course.findOne({
    where: {
      id: courseId,
    },
  });
  return await theCourse.getExams();
};

exports.setStatus = (range, newStatus) => {
  let query;
  if (range instanceof Array) {
    query = {
      where: {
        id: { [Sequelize.Op.in]: range },
      },
    };
  } else {
    query = {
      where: {
        id: range,
      },
    };
  }
  console.log(query);
  return Course.update(
    {
      status: newStatus,
    },
    query
  );
};

exports.model = Course;
