const path = require("path");
const sequelize = require("../db");
const Sequelize = require("sequelize");
const Util = require(path.resolve(__dirname, "../util"));

const Chapter = require("./Chapter");

class Question extends Sequelize.Model {}
Question.init(
  {
    id: {
      type: Sequelize.STRING(100),
      primaryKey: true,
      unique: true
    },
    title: Sequelize.STRING(100),
    right: Sequelize.STRING(10),
    type: Sequelize.STRING(20),
    enable: Sequelize.BOOLEAN,
    detail: Sequelize.TEXT,
    // forExam
    usage: Sequelize.BOOLEAN
  },
  { sequelize, modelName: "Question" }
);

exports.create = async (
  config = {
    title: "TestTitle",
    right: "",
    type: "trueFalse",
    detail: {},
    usage: false
  },
  chapterId
) => {
  config = {
    ...{
      title: "TestTitle",
      right: "",
      type: "trueFalse",
      detail: {},
      usage: false
    },
    ...config
  };
  if (typeof config.detail === "object")
    config.detail = JSON.stringify(config.detail);

  const [question, chapter] = await Promise.all([
    Question.create({
      enable: true,
      id: Util.uuid(),
      ...config
    }),
    (async () => {
      return (await chapterId)
        ? Chapter.model.findOne({
            where: {
              id: chapterId
            }
          })
        : undefined;
    })()
  ]);
  if (chapter) {
    await chapter.addQuestion(question);
  }
  return question;
};

exports.setEnable = async range => {
  console.log(range);
  return await Question.update(
    {
      enable: true
    },
    {
      where: { id: { [Sequelize.Op.in]: range } }
    }
  );
};

exports.setDisable = async range => {
  console.log(range);
  return await Question.update(
    {
      enable: false
    },
    {
      where: { id: { [Sequelize.Op.in]: range } }
    }
  );
};

exports.update = (id, newValue) => {
  return Question.findOne({
    where: { id }
  }).update(newValue);
};

exports.detail = async id => {
  const target = await Question.findOne({ id });
  return target.dataValues;
};

exports.getAll = async (chapterId, type, forceEnable = false) => {
  const chapter = await Chapter.model.findOne({
    where: { id: chapterId }
    // attributes: ["id", "title", "type", "usage"]
  });

  let search = {};
  if (type) {
    search.type = type;
  }
  console.log(forceEnable);
  if (forceEnable) {
    console.log("here");
    search.enable = true;
  }
  return chapter.getQuestions({ where: search });
};

exports.disable = questionLists => {
  return Question.update(
    {
      enable: false
    },
    {
      where: {
        [Sequelize.Op.in]: questionLists
      }
    }
  );
};

exports.enable = questionLists => {
  return Question.update(
    {
      enable: true
    },
    {
      where: {
        [Sequelize.Op.in]: questionLists
      }
    }
  );
};

exports.model = Question;
