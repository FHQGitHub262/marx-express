const path = require("path");
const sequelize = require(path.resolve(__dirname, "../db"));
const Sequelize = require("sequelize");
const Util = require(path.resolve(__dirname, "../util"));

const Paper = require("./Paper");
const Student = require("./Student");
const Course = require("./Course");

class Exam extends Sequelize.Model {}
Exam.init(
  {
    name: Sequelize.STRING(100),
    id: {
      type: Sequelize.STRING(100),
      primaryKey: true,
      unique: true
    },
    startAt: Sequelize.BIGINT,
    endAt: Sequelize.BIGINT,
    usage: Sequelize.BOOLEAN
  },
  { sequelize, modelName: "Exam" }
);

exports.create = async config => {
  const [exam, paper, students, courses] = await Promise.all([
    Exam.create({
      name: config.name,
      startAt: new Date(config.startAt).getTime(),
      endAt: new Date(config.endAt).getTime(),
      usage: config.type === "true" ? true : false,
      id: Util.uuid()
    }),
    Paper.model.findOne({
      where: {
        id: config.paperId
      }
    }),
    Student.model.findAll({
      where: {
        UserUuid: {
          [Sequelize.Op.in]: config.range.students
        }
      }
    }),
    Course.model.findAll({
      where: {
        id: {
          [Sequelize.Op.in]: config.range.courses
        }
      }
    })
  ]);
  // 创建考试本身
  // 将学生添加到考试中
  // 给考试分配试卷
  // 找到对应班级
  // 找到对应学生
  // 创建examPlan
  await Promise.all([
    exam.setPaper(paper),
    exam.setStudents(students),
    exam.setCourses(courses)
  ]);
  return exam;
};

exports.getAll = async () => {
  return await Exam.findAll();
};

exports.model = Exam;
