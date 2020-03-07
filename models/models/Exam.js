const path = require("path");
const sequelize = require(path.resolve(__dirname, "../db"));
const Sequelize = require("sequelize");
const Util = require(path.resolve(__dirname, "../util"));
const fs = require("fs");

const Paper = require("./Paper");
const Student = require("./Student");
const Course = require("./Course");

const Task = require("../../schedule/index");

class Exam extends Sequelize.Model {}
Exam.init(
  {
    name: Sequelize.STRING(100),
    id: {
      type: Sequelize.STRING(100),
      primaryKey: true,
      unique: true
    },
    // status: Sequelize.STRING,
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
      // status: "INIT"
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
    exam.setStudents(students, {
      through: {
        status: "BEFORE"
      }
    }),
    exam.setCourses(courses)
  ]);
  // 创建定时任务，考试前一天prepare考试
  Task.scheduleToDo(
    "prepare_exam",
    new Date(config.startAt).getTime() - 24 * 60 * 60 * 1000,
    JSON.stringify({
      id: exam.dataValues.id
    })
  );

  // 创建定时任务，考试结束后1h，删除redis里相关内容
  Task.scheduleToDo(
    "cleanup_exam",
    new Date(config.endAt).getTime() + 60 * 1000 * 60,
    JSON.stringify({
      id: exam.dataValues.id
    })
  );

  return exam;
};

exports.getAll = async () => {
  return await Exam.findAll();
};

exports.prepare = async examId => {
  const theExam = await Exam.findOne({
    where: {
      id: examId
    }
  });
  const [thePaperElement, theStudents] = await Promise.all([
    theExam.getPaper(),
    theExam.getStudents({
      attributes: ["UserUuid", "idNumber"]
    })
  ]);
  const thePaper = thePaperElement.dataValues;
  let theQuestionsData = {};
  const theQuestions = await thePaperElement.getQuestions({
    attributes: ["id", "title", "detail"]
  });
  theQuestions.forEach(elem => {
    theQuestionsData[elem.dataValues.id] = {
      title: elem.dataValues.title,
      detail: JSON.parse(elem.dataValues.detail),
      id: elem.dataValues.id
    };
  });
  const quezRange = Util.arrayGroupBy(
    (
      await thePaperElement.getQuestions({
        attributes: ["id", "type"]
      })
    ).map(item => item.dataValues),
    element => element.type
  );

  // 对每个学生处理一次，生成只有ID的试卷
  const targetPath = path.resolve(
    __dirname,
    "../../public/temp",
    `./${theExam.id}`
  );
  await Util.dirExists(targetPath);
  // 每一次生成试卷就保存到本地，保存到对应examId目录下，以学生uuid保存文件
  theStudents.forEach(student => {
    let paper = {};

    const totalTags = ["totalSingle", "totalMulti", "totalTrueFalse"];
    ["single", "multi", "trueFalse"].forEach((item, index) => {
      paper[item] = Util.arrayRandomPick(
        quezRange[item],
        thePaper[totalTags[index]]
      ).map(item => theQuestionsData[item.id]);
    });
    fs.writeFileSync(
      path.resolve(targetPath, `./${student.dataValues.UserUuid}.json`),
      JSON.stringify({
        exam: theExam.dataValues,
        paper
      })
    );
  });

  // 把考试状态改变
  theExam.update({
    // status: "READY"
  });
  // 添加定时任务，定时删除指定文件夹
};

exports.finishup = async (examId, studentId, examDeatail) => {
  const theExam = await Exam.findOne({
    where: {
      id: examId
    }
  });
  const theStudent = await Student.model.findOne({
    where: {
      UserUuid: studentId
    }
  });
  return await theExam.addStudent(theStudent, {
    through: {
      raw: JSON.stringify(examDeatail),
      status: "FIN"
    }
  });
};

exports.getReview = async (examId, studentId) => {
  const theExam = await Exam.findOne({
    where: {
      id: examId
    }
  });
  return (
    await theExam.getStudents({
      where: {
        UserUuid: studentId
      }
    })
  ).map(item => item.dataValues.AnswerExam);
};

exports.judge = async examId => {
  console.log("exam.judge");
};
exports.model = Exam;
