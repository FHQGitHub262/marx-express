const path = require("path");
const sequelize = require("../db");
const Sequelize = require("sequelize");
const Util = require(path.resolve(__dirname, "../util"));

const Question = require("./Question");

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
      unique: true
    },
    totalTrueFalse: Sequelize.INTEGER,
    totalMulti: Sequelize.INTEGER,
    totalSingle: Sequelize.INTEGER,
    currentTrueFalse: Sequelize.INTEGER,
    currentMulti: Sequelize.INTEGER,
    currentSingle: Sequelize.INTEGER
  },
  { sequelize, modelName: "Paper" }
);

exports.createPaper = async countConfig => {
  const thePaper = await Paper.create({
    id: Util.uuid(),
    name: countConfig.name,
    type: countConfig.forExam,
    totalSingle: countConfig.singleNum,
    totalMulti: countConfig.multiNum,
    totalTrueFalse: countConfig.truefalseNum,
    currentSingle: countConfig.singleList.length,
    currentMulti: countConfig.multiList.length,
    currentTrueFalse: countConfig.truefalseList.length
  });
  const theQuestions = await Question.model.findAll({
    where: {
      id: {
        [Sequelize.Op.in]: [
          ...countConfig.singleList,
          ...countConfig.multiList,
          ...countConfig.truefalseList
        ]
      }
    }
  });
  console.log(thePaper);
  await thePaper.setQuestions(theQuestions);
  return thePaper;
};

exports.getAll = async () => {
  return await Paper.findAll();
};

exports.addQuestions = async (paperId, config) => {
  const currentPaper = await Paper.findOne({ id: paperId });

  const keys = Object.keys(config).filter(
    type => ["trueFalse", "single", "multi"].indexOf(type) >= 0
  );
  for (let index = 0; index < keys.length; index++) {
    const type = keys[index];
    const typeKey = (type => {
      if (type === "trueFalse") return "currentTrueFalse";
      else if (type === "single") return "currentSingle";
      else if (type === "multi") return "currentMulti";
    })(type);
    const questionToAdd = await Question.model.findAll({
      usage: currentPaper.type,
      type,
      [Op.in]: config[type] instanceof Array ? config[type] : []
    });
    await currentPaper.addQuestions(questionToAdd);
    let updateValue = {};
    updateValue[typeKey] =
      currentPaper.dataValues[typeKey] + questionToAdd.length;
    await currentPaper.update(updateValue);
  }
};

exports.model = Paper;
