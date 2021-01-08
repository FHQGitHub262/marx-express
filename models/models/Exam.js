const path = require("path");
const sequelize = require(path.resolve(__dirname, "../db"));
const Sequelize = require("sequelize");
const Util = require(path.resolve(__dirname, "../util"));
const fs = require("fs");

const AdministrationClass = require("./AdministrationClass");
const Paper = require("./Paper");
const Student = require("./Student");
const Course = require("./Course");
const Teacher = require("./Teacher");
const Subject = require("./Subject");
const Major = require("./Major");
const College = require("./College");
const Question = require("./Question");

const { renderWord } = require('../word')
const Task = require("../../schedule/index");

class Exam extends Sequelize.Model { }
Exam.init(
  {
    name: Sequelize.STRING(100),
    id: {
      type: Sequelize.STRING(100),
      primaryKey: true,
      unique: true,
    },
    // status: Sequelize.STRING,
    startAt: Sequelize.BIGINT,
    endAt: Sequelize.BIGINT,
    usage: Sequelize.BOOLEAN,
  },
  { sequelize, modelName: "Exam" }
);

exports.create = async (config) => {
  const [exam, paper, students, courses] = await Promise.all([
    Exam.create({
      name: config.name,
      startAt: new Date(config.startAt).getTime(),
      endAt: new Date(config.endAt).getTime(),
      usage: config.type === "true" ? true : false,
      id: Util.uuid(),
      ratio: config.ratio,
      // status: "INIT"
    }),
    Paper.model.findOne({
      where: {
        id: config.paperId,
      },
    }),
    Student.model.findAll({
      where: {
        UserUuid: {
          [Sequelize.Op.in]: config.range.students,
        },
      },
    }),
    Course.model.findAll({
      where: {
        id: {
          [Sequelize.Op.in]: config.range.courses,
        },
      },
    }),
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
        status: "BEFORE",
        grade: 0,
        raw: "{}",
      },
    }),
    exam.setCourses(courses),
  ]);
  // 创建定时任务，考试前一天prepare考试
  Task.scheduleToDo(
    "prepare_exam",
    new Date().getTime(),
    // new Date(config.startAt).getTime() - 24 * 60 * 60 * 1000,
    JSON.stringify({
      id: exam.dataValues.id,
    })
  );

  // 创建定时任务，考试结束后1min，judge考试
  Task.scheduleToDo(
    "judge_exam",
    new Date(config.endAt).getTime() - 60 * 1000,
    JSON.stringify({
      id: exam.dataValues.id,
    })
  );

  // 创建定时任务，考试结束后1h，删除redis里相关内容
  Task.scheduleToDo(
    "cleanup_exam",
    new Date(config.endAt).getTime() + 60 * 1000 * 60,
    JSON.stringify({
      id: exam.dataValues.id,
    })
  );

  return exam;
};

exports.detail = async (id) => {
  const theExam = await Exam.findOne({
    where: { id: id },
  });
  const [courses, students] = await Promise.all([
    theExam.getCourses(),
    theExam.getStudents(),
  ]);
  return {
    courses: courses.map((item) => item.dataValues.id),
    students: students.map((item) => item.dataValues.UserUuid),
  };
};

exports.getAll = async (id, range) => {
  let query = {};
  if (range instanceof Array && range.length === 2) {
    console.log("here");
    query = {
      startAt: { [Sequelize.Op.gt]: range[0] },
      endAt: { [Sequelize.Op.lt]: range[1] },
    };
  }
  if (id !== undefined) {
    const theSubject = await Subject.model.findOne({ where: { id } });
    const thePapers = (await theSubject.getPapers()).map(
      (item) => item.dataValues.id
    );

    return await Util.arraySyncFilter(
      await Exam.findAll({ where: query }),
      async (item) => {
        let targetPaper;
        try {
          targetPaper = ((await item.getPaper()) || { dataValues: {} })
            .dataValues.id;
        } catch (error) {
          targetPaper = "";
        }

        return thePapers.indexOf(targetPaper) >= 0;
      }
    );
  } else {
    return await Exam.findAll({ where: query });
  }
};

exports.getAllForTeacher = async (teacherId) => {
  let query = {};
  if (range instanceof Array && range.length === 2) {
    console.log("here");
    query = {
      startAt: { [Sequelize.Op.gt]: range[0] },
      endAt: { [Sequelize.Op.lt]: range[1] },
    };
  }
  const theTeacher = await Teacher.model.findOne({
    where: { UserUuid: teacherId },
  });
  const grantedCourse = await theTeacher.getCourses();
  if (id !== undefined) {
    const theSubject = await Subject.model.findOne({ where: { id } });
    const thePapers = (await theSubject.getPapers()).map(
      (item) => item.dataValues.id
    );

    const hash = [];
    const theExams = (
      await Promise.all(
        grantedCourse.map((course) => course.getExams({ where: query }))
      )
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

    return await Util.arraySyncFilter(theExams, async (item) => {
      let targetPaper;
      try {
        targetPaper = ((await item.getPaper()) || { dataValues: {} }).dataValues
          .id;
      } catch (error) {
        targetPaper = "";
      }

      return thePapers.indexOf(targetPaper) >= 0;
    });
  } else {
    const hash = [];
    const theExams = (
      await Promise.all(
        grantedCourse.map((course) => course.getExams({ where: query }))
      )
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
  }
};

exports.prepare = async (examId) => {
  const exchange = {
    easy: "易",
    medium: "中",
    hard: "难",
    易: "easy",
    中: "medium",
    难: "hard",
  };
  // 获取exam信息
  const theExam = await Exam.findOne({ where: { id: examId } });

  // 获取paper和student
  const [thePaperElement, theStudents] = await Promise.all([
    theExam.getPaper(),
    theExam.getStudents({
      attributes: ["UserUuid", "idNumber"],
    }),
  ]);

  const thePaper = thePaperElement.dataValues;
  console.log(thePaper);

  // 初始化limitr
  let limiter = JSON.parse(String(thePaper.limiter));
  if (typeof limiter === "string") limiter = JSON.parse(limiter);

  const ratio = JSON.parse(thePaper.ratio);
  const total = Object.values(limiter).reduce(
    (prev, current) => prev + current,
    0
  );
  const totalName = ["totalTrueFalse", "totalSingle", "totalMulti"];

  let index = 0;
  const data = {};
  for (let type of ["trueFalse", "single", "multi"]) {
    const totalValue = thePaper[totalName[index]];
    const chapters = Object.keys(limiter);
    console.log(typeof limiter, chapters);
    data[type] = chapters.reduce((prev, current) => {
      return {
        ...prev,
        [current]: {
          total: {
            length: 0,
            count: Math.ceil((totalValue * limiter[current]) / total),
          },
          easy: {
            count: Math.ceil(
              (((totalValue * limiter[current]) / total) * ratio[0]) / 10
            ),
            data: [],
          },
          medium: {
            count: Math.ceil(
              (((totalValue * limiter[current]) / total) *
                (ratio[1] - ratio[0])) /
              10
            ),
            data: [],
          },
          hard: {
            count: Math.ceil(
              (((totalValue * limiter[current]) / total) * (10 - ratio[1])) / 10
            ),
            data: [],
          },
        },
      };
    }, {});

    index++;
  }

  // 获取题目数据
  let theQuestionsData = [];
  const theQuestions = await thePaperElement.getQuestions({
    attributes: ["id", "title", "detail", "difficult", "type"],
    where: {
      enable: true,
    },
  });
  for (current of theQuestions) {
    theQuestionsData.push({
      id: current.dataValues.id,
      title: current.dataValues.title,
      detail: current.dataValues.detail,
      difficult: current.dataValues.difficult,
      type: current.dataValues.type,
      chapter: (await current.getChapters())[0].dataValues.id,
    });
  }

  theQuestionsData = Util.arrayGroupBy(theQuestionsData, (item) => item.type);

  const typeKeys = Object.keys(theQuestionsData);
  for (let i = 0; i < typeKeys.length; i++) {
    let groupByCourse = Util.arrayGroupBy(
      theQuestionsData[typeKeys[i]],
      (element) => element.chapter
    );

    let groups = Object.keys(groupByCourse);
    for (let j = 0; j < groups.length; j++) {
      groupByCourse[groups[j]] = Util.arrayGroupBy(
        groupByCourse[groups[j]],
        (element) => element.difficult
      );
    }
    theQuestionsData[typeKeys[i]] = groupByCourse;
  }
  // 整理成了 类型 - 章节 - 难度的三级结构

  // 对每个学生处理一次，生成只有ID的试卷
  const targetPath = path.resolve(
    __dirname,
    "../../public/temp",
    `./${theExam.id}`
  );
  await Util.rmdir(targetPath);
  await Util.dirExists(targetPath);
  // 每一次生成试卷就保存到本地，保存到对应examId目录下，以学生uuid保存文件
  theStudents.forEach((student) => {
    let paper = {};

    let raw = {
      trueFalse: [],
      single: [],
      multi: [],
    };
    // 开始遍历，按照类型分别取做，判断各个章节的各个难度是否足够，足够就任意取需要的，不足够就全部拿
    const nameExchange = {
      trueFalse: "totalTrueFalse",
      single: "totalSingle",
      multi: "totalMulti",
    };
    // #TODO
    for (let i = 0; i < typeKeys.length; i++) {
      const typeKey = typeKeys[i];
      const chapters = Object.keys(theQuestionsData[typeKey]);
      raw[typeKey] = Object.values(theQuestionsData[typeKey])
        .map((item, index) => {
          // console.log(item);
          const chapterId = chapters[index];
          const difficults = Object.keys(item);
          const firstPick = difficults
            .map((_diff) => {
              const elem = item[_diff];
              if (elem === undefined || Object.keys(elem).length === 0) {
                return [];
              }
              // console.log(data[typeKey]);
              return Util.arrayRandomPick(
                elem,
                Math.max(
                  data[typeKey][chapterId][exchange[_diff]].count,
                  thePaper[nameExchange[_diff]]
                )
              );
            })
            .reduce((prev, curr) => [...prev, ...curr], []);

          const total = Object.values(item).reduce((prev, curr) => {
            return [...prev, ...curr];
          }, []);

          const secondPick = Util.arrayFill(
            total,
            firstPick,
            data[typeKey][chapterId].total.count - firstPick.length,
            (elem) => elem.id
          );
          return secondPick;
        })
        .reduce((prev, curr) => [...prev, ...curr], [])
        .splice(0, thePaper[nameExchange[typeKey]]);

      if (raw[typeKey].length === thePaper[nameExchange[typeKey]]) continue;

      let total = Object.values(theQuestionsData[typeKey]).reduce(
        (prev, curr) => {
          return [
            ...prev,
            ...Object.values(curr).reduce((subprev, subcurr) => {
              return [...subprev, ...subcurr];
            }, []),
          ];
        },
        []
      );

      raw[typeKey] = Util.arrayFill(
        total,
        raw[typeKey],
        thePaper[nameExchange[typeKey]] - raw[typeKey].length,
        (item) => item.id
      );
    }

    fs.writeFileSync(
      path.resolve(targetPath, `./${student.dataValues.UserUuid}.json`),
      JSON.stringify({
        exam: theExam.dataValues,
        paper: raw,
      })
    );
  });

  console.log("Preper finished");
};

exports._prepare = async (examId) => {
  const theExam = await Exam.findOne({ where: { id: examId } });
  const [thePaperElement, theStudents] = await Promise.all([
    theExam.getPaper(),
    theExam.getStudents({
      attributes: ["UserUuid", "idNumber"],
    }),
  ]);
  const thePaper = thePaperElement.dataValues;
  let theQuestionsData = {};
  const theQuestions = await thePaperElement.getQuestions({
    attributes: ["id", "title", "detail"],
  });
  theQuestions.forEach((elem) => {
    theQuestionsData[elem.dataValues.id] = {
      title: elem.dataValues.title,
      detail: JSON.parse(elem.dataValues.detail),
      id: elem.dataValues.id,
    };
  });
  const quezRange = Util.arrayGroupBy(
    (
      await thePaperElement.getQuestions({
        attributes: ["id", "type"],
      })
    ).map((item) => {
      console.log(item.dataValues);
      return item.dataValues;
    }),
    (element) => element.type
  );

  console.log(quezRange);

  // 对每个学生处理一次，生成只有ID的试卷
  const targetPath = path.resolve(
    __dirname,
    "../../public/temp",
    `./${theExam.id}`
  );
  await Util.dirExists(targetPath);
  // 每一次生成试卷就保存到本地，保存到对应examId目录下，以学生uuid保存文件
  theStudents.forEach((student) => {
    let paper = {};

    const totalTags = ["totalSingle", "totalMulti", "totalTrueFalse"];
    ["single", "multi", "trueFalse"].forEach((item, index) => {
      paper[item] = Util.arrayRandomPick(
        quezRange[item] || [],
        thePaper[totalTags[index]]
      ).map((item) => theQuestionsData[item.id]);
    });
    fs.writeFileSync(
      path.resolve(targetPath, `./${student.dataValues.UserUuid}.json`),
      JSON.stringify({
        exam: theExam.dataValues,
        paper,
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
      id: examId,
    },
  });
  const theStudent = await Student.model.findOne({
    where: {
      UserUuid: studentId,
    },
  });
  return await theExam.addStudent(theStudent, {
    through: {
      raw: JSON.stringify(examDeatail),
      status: "FIN",
    },
  });
};

exports.getReview = async (examId, studentId) => {
  const theExam = await Exam.findOne({
    where: {
      id: examId,
    },
  });
  return (
    await theExam.getStudents({
      where: {
        UserUuid: studentId,
      },
    })
  ).map((item) => item.dataValues.AnswerExam);
};

exports.judge = async (examId) => {
  const theExam = await Exam.findOne({ where: { id: examId } });
  const thePaper = (await (await theExam.getPaper()).getQuestions())
    .map((item) => ({
      id: item.id,
      right: item.right,
      type: item.type,
    }))
    .reduce(
      (prev, current) => ({
        ...prev,
        [current.id]: { right: current.right, type: current.type },
      }),
      {}
    );
  const records = await theExam.getStudents();
  records.forEach(async (item) => {
    const raw = JSON.parse(item.dataValues.AnswerExam.raw || "{}");
    const answers = Object.values(raw).reduce(
      (prev, current) => ({
        ...current,
        ...prev,
      }),
      {}
    );

    const grade = Object.keys(answers).reduce((prev, current) => {
      console.log(answers[current], thePaper[current]);
      return prev + judgeQuestion(answers[current], thePaper[current]);
    }, 0);

    await theExam.addStudent(item, {
      through: {
        grade,
      },
    });
  });
};

const judgeQuestion = (answer, raw) => {
  switch (raw.type) {
    case "single": {
      return answer === JSON.parse(raw.right)[0] ? 1 : 0;
    }
    case "trueFalse": {
      return String(answer).toUpperCase() === JSON.parse(raw.right)[0] ? 1 : 0;
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

exports.getDocx = async (examId, studentId) => {
  const theExam = await Exam.findOne({ where: { id: examId } });
  const thePaper = await theExam.getPaper();

  const theStudent = (await theExam.getStudents()).find(item => item.dataValues.UserUuid === studentId)
  const raw = JSON.parse(theStudent.dataValues.AnswerExam.raw)

  const renderData = {
    user: {
      name: theStudent.name,
      id: theStudent.idNumber
    },
    exam: {
      name: theExam.dataValues.name,
      grade: theStudent.dataValues.AnswerExam.grade
    },
    paper: {
      single: await Object.keys(raw.single || {}).reduce(async (prev, curr) => {
        return {
          ...await prev,
          [curr]: {
            answer: raw.single[curr],
            questionVO: await Question.model.findOne({ where: { id: curr } })
          }
        }
      }, {}),
      multi: await Object.keys(raw.multi || {}).reduce(async (prev, curr) => {
        return {
          ...await prev,
          [curr]: {
            answer: raw.multi[curr],
            questionVO: await Question.model.findOne({ where: { id: curr } })
          }
        }
      }, {}),
      truefalse: await Object.keys(raw.trueFalse || {}).reduce(async (prev, curr) => {
        return {
          ...await prev,
          [curr]: {
            answer: raw.trueFalse[curr],
            questionVO: await Question.model.findOne({ where: { id: curr } })
          }
        }
      }, {}),
    }
  }

  return { buffer: await renderWord(renderData), studentName: theStudent.name, name: theExam.dataValues.name }
}

exports.galance = async (examId) => {
  const theExam = await Exam.findOne({ where: { id: examId } });
  const thePaper = await theExam.getPaper();
  const total =
    thePaper.dataValues.totalSingle +
    thePaper.dataValues.totalMulti +
    thePaper.dataValues.totalTrueFalse;

  const theAdClasses = [];
  let record = (await theExam.getStudents()).map((item) => {
    if (theAdClasses.indexOf(item.dataValues.AdministrationClassId) < 0) {
      theAdClasses.push(item.dataValues.AdministrationClassId);
    }
    return {
      id: item.dataValues.UserUuid,
      idNumber: item.dataValues.idNumber,
      grade: item.dataValues.AnswerExam.grade,
      name: item.dataValues.name,
      AdministrationClassId: item.dataValues.AdministrationClassId,
    };
  });

  const theClasses = (
    await Promise.all(
      await AdministrationClass.model.findAll({
        where: { id: { [Sequelize.Op.in]: theAdClasses } },
      })
    )
  ).reduce(
    (prev, item) => ({
      ...prev,
      [item.dataValues.id]: item.dataValues,
    }),
    {}
  );

  const theMajors = await getMajors(
    Array.from(new Set(Object.values(theClasses).map((item) => item.MajorId)))
  );

  const theColleges = await getColleges(
    Array.from(new Set(Object.values(theMajors).map((item) => item.CollegeId)))
  );

  record = record.map((item) => ({
    ...item,
    class: theClasses[item.AdministrationClassId].name,
    major: theMajors[theClasses[item.AdministrationClassId].MajorId].name,
    college:
      theColleges[
        theMajors[theClasses[item.AdministrationClassId].MajorId].CollegeId
      ].name,
  }));

  let statistics = {
    max: 0,
    pass: 0,
    average: 0,
  };
  record.forEach((item) => {
    statistics.max = statistics.max > item.grade ? statistics.max : item.grade;
    statistics.pass = statistics.pass + item.grade > 0.6 * total ? 1 : 0;
    statistics.average = statistics.average + item.grade;
  });
  statistics.average = statistics.average / record.length;
  return {
    record,
    statistics: statistics,
  };
};

exports.output = async (examId) => {
  var xlsx = require("node-xlsx").default;

  const data = [["学号", "姓名", "分数", "考试名称", "学院", "专业", "班级"]];

  const theExam = await Exam.findOne({ where: { id: examId } });

  const record = (await theExam.getStudents()).map((item) => ({
    idNumber: item.dataValues.idNumber,
    name: item.dataValues.name,
    grade: item.dataValues.AnswerExam.grade || 0,
    AdministrationClassId: item.dataValues.AdministrationClassId,
  }));

  const theClasses = await getClasses(
    Array.from(new Set(record.map((item) => item.AdministrationClassId)))
  );

  const theMajors = await getMajors(
    Array.from(new Set(Object.values(theClasses).map((item) => item.MajorId)))
  );

  const theColleges = await getColleges(
    Array.from(new Set(Object.values(theMajors).map((item) => item.CollegeId)))
  );

  return {
    name: theExam.dataValues.name,
    buf: xlsx.build([
      {
        name: "考试详情",
        data: [
          ...data,
          ...record.map((item) => [
            item.idNumber,
            item.name,
            item.grade,
            theExam.dataValues.name,
            theColleges[
              theMajors[theClasses[item.AdministrationClassId].MajorId]
                .CollegeId
            ].name,
            theMajors[theClasses[item.AdministrationClassId].MajorId].name,
            theClasses[item.AdministrationClassId].name,
          ]),
        ],
      },
    ]),
  }; // Returns a buffer
};

exports.batchoutput = async (examIds) => {
  var xlsx = require("node-xlsx").default;

  const data = [["学号", "姓名", "分数", "考试名称", "学院", "专业", "班级"]];

  const theExams = await Exam.findAll({
    where: { id: { [Sequelize.Op.in]: examIds } },
  });

  let yields = theExams.map(async (theExam) => {
    const record = (await theExam.getStudents()).map((item) => ({
      idNumber: item.dataValues.idNumber,
      name: item.dataValues.name,
      grade: item.dataValues.AnswerExam.grade || 0,
      AdministrationClassId: item.dataValues.AdministrationClassId,
    }));

    const theClasses = await getClasses(
      Array.from(new Set(record.map((item) => item.AdministrationClassId)))
    );

    const theMajors = await getMajors(
      Array.from(new Set(Object.values(theClasses).map((item) => item.MajorId)))
    );

    const theColleges = await getColleges(
      Array.from(
        new Set(Object.values(theMajors).map((item) => item.CollegeId))
      )
    );

    return record.map((item) => [
      item.idNumber,
      item.name,
      item.grade,
      theExam.dataValues.name,
      theColleges[
        theMajors[theClasses[item.AdministrationClassId].MajorId].CollegeId
      ].name,
      theMajors[theClasses[item.AdministrationClassId].MajorId].name,
      theClasses[item.AdministrationClassId].name,
    ]);
  });

  const rowData = await Promise.all(yields);
  return {
    name: `批量导出成绩 - ${new Date().toLocaleDateString()}`,
    buf: xlsx.build([
      {
        name: "考试详情",
        data: [
          ...data,
          ...rowData.reduce((prev, item) => [...prev, ...item], []),
        ],
      },
    ]),
  }; // Returns a buffer
};

exports.update = async (config) => {
  console.log("config", config);
  const theExam = await Exam.findOne({
    where: { id: config.id },
  });
  const prevStart = theExam.dataValues.startAt;
  const prevEnd = theExam.dataValues.endAt;

  delete config.id;
  const [exam, paper, students, courses] = await Promise.all([
    theExam.update({
      ...config,
      startAt: new Date(config.startAt).getTime(),
      endAt: new Date(config.endAt).getTime(),
      usage: config.type === "true" ? true : false,
    }),
    Paper.model.findOne({
      where: {
        id: config.paperId,
      },
    }),
    Student.model.findAll({
      where: {
        UserUuid: {
          [Sequelize.Op.in]: config.range.students,
        },
      },
    }),
    Course.model.findAll({
      where: {
        id: {
          [Sequelize.Op.in]: config.range.courses,
        },
      },
    }),
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
        status: "BEFORE",
        grade: 0,
        raw: "{}",
      },
    }),
    exam.setCourses(courses),
  ]);

  // // 取消定时任务
  // Task.cancelToDo(
  //   "prepare_exam",
  //   new Date(prevStart).getTime() - 24 * 60 * 60 * 1000,
  //   JSON.stringify({
  //     id: exam.dataValues.id,
  //   })
  // );

  // 创建定时任务，考试结束后1min，judge考试
  // Task.cancelToDo(
  //   "judge_exam",
  //   new Date(prevEnd).getTime() - 60 * 1000,
  //   JSON.stringify({
  //     id: exam.dataValues.id,
  //   })
  // );

  Task.scheduleToDo(
    "cleanup_exam",
    new Date(prevEnd).getTime() + 60 * 1000 * 60,
    JSON.stringify({
      id: exam.dataValues.id,
    })
  );

  // 创建定时任务，考试前一天prepare考试
  Task.scheduleToDo(
    "prepare_exam",
    // new Date(config.startAt).getTime() - 24 * 60 * 60 * 1000,
    Date.now(),
    JSON.stringify({
      id: exam.dataValues.id,
    })
  );

  // 创建定时任务，考试结束后1min，judge考试
  // Task.scheduleToDo(
  //   "judge_exam",
  //   new Date(config.endAt).getTime() - 60 * 1000,
  //   JSON.stringify({
  //     id: exam.dataValues.id,
  //   })
  // );

  // 创建定时任务，考试结束后1h，删除redis里相关内容
  Task.scheduleToDo(
    "cleanup_exam",
    new Date(config.endAt).getTime() + 60 * 1000 * 60,
    JSON.stringify({
      id: exam.dataValues.id,
    })
  );

  return exam;
};

const getClasses = async (ids) => {
  const major = (
    await AdministrationClass.model.findAll({
      where: { id: { [Sequelize.Op.in]: ids } },
    })
  ).reduce(
    (prev, item) => ({
      ...prev,
      [item.dataValues.id]: item.dataValues,
    }),
    {}
  );
  return major;
};

const getMajors = async (ids) => {
  const major = (
    await Major.model.findAll({
      where: { id: { [Sequelize.Op.in]: ids } },
    })
  ).reduce(
    (prev, item) => ({
      ...prev,
      [item.dataValues.id]: item.dataValues,
    }),
    {}
  );
  return major;
};

const getColleges = async (ids) => {
  return (
    await College.model.findAll({
      where: { id: { [Sequelize.Op.in]: ids } },
    })
  ).reduce(
    (prev, item) => ({
      ...prev,
      [item.dataValues.id]: item.dataValues,
    }),
    {}
  );
};
exports.model = Exam;
