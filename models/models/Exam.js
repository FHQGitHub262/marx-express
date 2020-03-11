const path = require("path");
const sequelize = require(path.resolve(__dirname, "../db"));
const Sequelize = require("sequelize");
const Util = require(path.resolve(__dirname, "../util"));
const fs = require("fs");

const Paper = require("./Paper");
const Student = require("./Student");
const Course = require("./Course");
const Teacher = require("./Teacher");

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

exports.detail = async id => {
  const theExam = await Exam.findOne({
    where: { id: id }
  });
  const [courses, students] = await Promise.all([
    theExam.getCourses(),
    theExam.getStudents()
  ]);
  return {
    courses: courses.map(item => item.dataValues.id),
    students: students.map(item => item.dataValues.UserUuid)
  };
};

exports.getAll = async () => {
  return await Exam.findAll();
};

exports.getAllForTeacher = async teacherId => {
  const theTeacher = await Teacher.model.findOne({
    where: {
      UserUuid: teacherId
    }
  });
  const grantedCourse = await theTeacher.getCourses();
  const hash = [];
  const theExams = (
    await Promise.all(grantedCourse.map(course => course.getExams()))
  )
    .reduce((prev, current) => {
      return [...prev, ...current];
    }, [])
    .reduce((prev, current) => {
      if (hash.indexOf(current.id) < 0) {
        return [...prev, current];
      } else {
        return prev;
      }
    }, []);

  return theExams;
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
  const theExam = await Exam.findOne({ where: { id: examId } });
  const thePaper = (await (await theExam.getPaper()).getQuestions())
    .map(item => ({
      id: item.id,
      right: item.right,
      type: item.type
    }))
    .reduce(
      (prev, current) => ({
        ...prev,
        [current.id]: { right: current.right, type: current.type }
      }),
      {}
    );
  const records = await theExam.getStudents();
  records.forEach(async item => {
    const raw = JSON.parse(item.dataValues.AnswerExam.raw);
    const answers = Object.values(raw).reduce(
      (prev, current) => ({
        ...current,
        ...prev
      }),
      {}
    );

    const grade = Object.keys(answers).reduce((prev, current) => {
      console.log(answers[current], thePaper[current]);
      return prev + judgeQuestion(answers[current], thePaper[current]);
    }, 0);

    await theExam.addStudent(item, {
      through: {
        grade
      }
    });
  });
};

const judgeQuestion = (answer, raw) => {
  switch (raw.type) {
    case "single": {
      return answer === JSON.parse(raw.right)[0] ? 1 : 0;
    }
    case "trueFalse": {
      return String(answer) === JSON.parse(raw.right)[0] ? 1 : 0;
    }
    case "multi": {
      const answerList = Array.from(new Set(answer || []));
      const rawList = Array.from(new Set(raw.right || []));
      if (rawList.length !== answerList.length) return 0;
      for (let i = 0; i < answerList.length; i++) {
        if (rawList.indexOf(answerList[i]) < 0) {
          return 0;
        }
      }
      return 1;
    }
  }
};

exports.galance = async examId => {
  const theExam = await Exam.findOne({ where: { id: examId } });
  const thePaper = await theExam.getPaper();
  const total =
    thePaper.dataValues.totalSingle +
    thePaper.dataValues.totalMulti +
    thePaper.dataValues.totalTrueFalse;
  console.log(thePaper);
  const record = (await theExam.getStudents()).map(item => ({
    id: item.dataValues.UserUuid,
    idNumber: item.dataValues.idNumber,
    grade: item.dataValues.AnswerExam.grade,
    name: item.dataValues.name
  }));
  let statistics = {
    max: 0,
    pass: 0,
    average: 0
  };
  record.forEach(item => {
    statistics.max = statistics.max > item.grade ? statistics.max : item.grade;
    statistics.pass = statistics.pass + item.grade > 0.6 * total ? 1 : 0;
    statistics.average = statistics.average + item.grade;
  });
  statistics.average = statistics.average / record.length;
  return {
    record,
    statistics: statistics
  };
};

exports.update = async config => {
  const theExam = await Exam.findOne({
    where: { id: config.id }
  });
  const prevStart = theExam.dataValues.startAt;
  const prevEnd = theExam.dataValues.endAt;

  delete config.id;
  const [exam, paper, students, courses] = await Promise.all([
    theExam.update({
      ...config,
      startAt: new Date(config.startAt).getTime(),
      endAt: new Date(config.endAt).getTime(),
      usage: config.type === "true" ? true : false
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

  // TODO 取消定时任务

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
exports.model = Exam;
