const path = require("path");
const sequelize = require("../db");
const Sequelize = require("sequelize");
const Util = require(path.resolve(__dirname, "../util"));

const Question = require("./Question");
const Teacher = require("./Teacher");
const Subject = require("./Subject");
const Op = Sequelize.Op;

class Paper extends Sequelize.Model {}
Paper.init(
  {
    name: Sequelize.STRING(100),
    // true: 正式考试
    // false: 平时练习
    type: Sequelize.BOOLEAN,
    id: {
      type: Sequelize.STRING(100),
      primaryKey: true,
      unique: true,
    },
    totalTrueFalse: Sequelize.INTEGER,
    totalMulti: Sequelize.INTEGER,
    totalSingle: Sequelize.INTEGER,
    currentTrueFalse: Sequelize.INTEGER,
    currentMulti: Sequelize.INTEGER,
    currentSingle: Sequelize.INTEGER,
    ratio: Sequelize.STRING(100),
    limiter: Sequelize.TEXT,
  },
  { sequelize, modelName: "Paper" }
);

// Paper.sync({ alter: true });

exports.createPaper = async (countConfig) => {
  const thePaper = await Paper.create({
    id: Util.uuid(),
    name: countConfig.name,
    type: countConfig.forExam,
    ratio: JSON.stringify(countConfig.ratio),
    limiter: JSON.stringify(countConfig.limiter),
    totalSingle: countConfig.singleNum,
    totalMulti: countConfig.multiNum,
    totalTrueFalse: countConfig.truefalseNum,
    currentSingle: countConfig.singleList.length,
    currentMulti: countConfig.multiList.length,
    currentTrueFalse: countConfig.truefalseList.length,
  });
  const theQuestions = await Question.model.findAll({
    where: {
      id: {
        [Sequelize.Op.in]: [
          ...countConfig.singleList,
          ...countConfig.multiList,
          ...countConfig.truefalseList,
        ],
      },
    },
  });
  const theSubject = await Subject.model.findOne({
    where: {
      id: countConfig.chapter,
    },
  });
  thePaper.addSubject(theSubject);
  await thePaper.addQuestions(theQuestions);
  return thePaper;
};

exports.getAll = async (usage, subject) => {
  const query = usage !== undefined ? { type: usage === "true" ? 1 : 0 } : {};
  console.log("subject", subject);
  if (!!subject) {
    console.log(subject);
    const theSubject = await Subject.model.findAll({
      where: {
        id: subject,
        ...query,
      },
      order: [["createdAt", "DESC"]],
    });
    const hash = [];
    const thePapers = (
      await Promise.all(theSubject.map((subject) => subject.getPapers()))
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
    return thePapers;
  } else {
    console.log("here", {
      where: { ...query },
      order: [["createdAt", "DESC"]],
    });
    return await Paper.findAll({
      where: { ...query },
      order: [["createdAt", "DESC"]],
    });
  }
};

exports.getAllForTeacher = async (teacherId, usage) => {
  const query = usage !== undefined ? { type: usage === "true" ? 1 : 0 } : {};
  const theTeacher = await Teacher.model.findOne({
    where: {
      UserUuid: teacherId,
    },
  });
  const grantedCourse = await theTeacher.getCourses();
  let theSubject;
  if (!!subject) {
    theSubject = await Subject.model.findAll({
      where: {
        id: subject,
        ...query,
      },
      order: [["createdAt", "DESC"]],
    });
  } else {
    theSubject = await Subject.model.findAll({
      where: {
        id: {
          [Sequelize.Op.in]: Array.from(
            new Set(grantedCourse.map((item) => item.dataValues.SubjectId))
          ),
        },
        ...query,
      },
      order: [["createdAt", "DESC"]],
    });
  }

  const hash = [];
  const thePapers = (
    await Promise.all(
      theSubject.map((subject) =>
        subject.getPapers({
          order: [["createdAt", "DESC"]],
        })
      )
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

  return thePapers;
};

exports.addQuestions = async (paperId, config) => {
  const currentPaper = await Paper.findOne({ id: paperId });

  const keys = Object.keys(config).filter(
    (type) => ["trueFalse", "single", "multi"].indexOf(type) >= 0
  );
  for (let index = 0; index < keys.length; index++) {
    const type = keys[index];
    const typeKey = ((type) => {
      if (type === "trueFalse") return "currentTrueFalse";
      else if (type === "single") return "currentSingle";
      else if (type === "multi") return "currentMulti";
    })(type);
    const questionToAdd = await Question.model.findAll({
      usage: currentPaper.type,
      type,
      [Op.in]: config[type] instanceof Array ? config[type] : [],
    });
    await currentPaper.addQuestions(questionToAdd);
    let updateValue = {};
    updateValue[typeKey] =
      currentPaper.dataValues[typeKey] + questionToAdd.length;
    await currentPaper.update(updateValue);
  }
};
exports.getDetail = async (id) => {
  const thePaper = await Paper.findOne({
    where: { id },
  });
  const [questions, subject] = await Promise.all([
    thePaper.getQuestions(),
    thePaper.getSubjects(),
  ]);

  return {
    questions: Util.arrayGroupBy(
      questions.map((item) => ({
        id: item.dataValues.id,
        type: item.dataValues.type,
      })),
      (element) => element.type
    ),
    subject: subject[0].dataValues.id,
  };
};

exports.updatePaper = async (config) => {
  const id = config.id;
  const thePaper = await Paper.findOne({
    where: { id },
  });

  const data = await thePaper.update({
    name: config.name,
    type: config.forExam,
    ratio: config.ratio,
    limiter: config.limiter,
    totalSingle: config.singleNum,
    totalMulti: config.multiNum,
    totalTrueFalse: config.truefalseNum,
    currentSingle: config.singleList.length,
    currentMulti: config.multiList.length,
    currentTrueFalse: config.truefalseList.length,
  });
  // console.log("[Data]", data)
  const theQuestions = await Question.model.findAll({
    where: {
      id: {
        [Sequelize.Op.in]: [
          ...config.singleList,
          ...config.multiList,
          ...config.truefalseList,
        ],
      },
    },
  });
  const theSubject = await Subject.model.findOne({
    where: {
      id: config.chapter,
    },
  });
  await Promise.all([
    thePaper.setSubjects([theSubject]),
    thePaper.setQuestions(theQuestions),
  ]);
  return thePaper;
};

exports.model = Paper;
