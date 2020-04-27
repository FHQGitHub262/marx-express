const path = require("path");
const sequelize = require("../db");
const Sequelize = require("sequelize");
const Util = require(path.resolve(__dirname, "../util"));

const Chapter = require("./Chapter");
const Subject = require("./Subject");
const xlsx = require("node-xlsx").default;

class Question extends Sequelize.Model {}
Question.init(
  {
    id: {
      type: Sequelize.STRING(100),
      primaryKey: true,
      unique: true,
    },
    title: Sequelize.STRING(100),
    right: Sequelize.STRING(10),
    type: Sequelize.STRING(20),
    enable: Sequelize.BOOLEAN,
    detail: Sequelize.TEXT,
    // forExam
    usage: Sequelize.BOOLEAN,
    difficult: Sequelize.STRING(20),
  },
  { sequelize, modelName: "Question" }
);

exports.create = async (
  config = {
    title: "TestTitle",
    right: "",
    type: "trueFalse",
    detail: {},
    usage: false,
  },
  chapterId
) => {
  config = {
    ...{
      title: "TestTitle",
      right: "",
      type: "trueFalse",
      detail: {},
      usage: false,
    },
    ...config,
  };
  if (typeof config.detail === "object")
    config.detail = JSON.stringify(config.detail);

  const [question, chapter] = await Promise.all([
    Question.create({
      enable: true,
      id: Util.uuid(),
      ...config,
    }),
    (async () => {
      return (await chapterId)
        ? Chapter.model.findOne({
            where: {
              id: chapterId,
            },
          })
        : undefined;
    })(),
  ]);
  if (chapter) {
    await chapter.addQuestion(question);
  }
  return question;
};

exports.setEnable = async (range) => {
  console.log(range);
  return await Question.update(
    {
      enable: true,
    },
    {
      where: { id: { [Sequelize.Op.in]: range } },
    }
  );
};

exports.setDisable = async (range) => {
  console.log(range);
  return await Question.update(
    {
      enable: false,
    },
    {
      where: { id: { [Sequelize.Op.in]: range } },
    }
  );
};

exports.update = (id, newValue) => {
  return Question.findOne({
    where: { id },
  }).update(newValue);
};

exports.detail = async (id) => {
  const target = await Question.findOne({ id });
  return target.dataValues;
};

exports.getAll = async (chapterId, type, forceEnable = false) => {
  const chapter = await Chapter.model.findOne({
    where: { id: chapterId },
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

exports.disable = (questionLists) => {
  return Question.update(
    {
      enable: false,
    },
    {
      where: {
        [Sequelize.Op.in]: questionLists,
      },
    }
  );
};

exports.enable = (questionLists) => {
  return Question.update(
    {
      enable: true,
    },
    {
      where: {
        [Sequelize.Op.in]: questionLists,
      },
    }
  );
};

exports.import = async (fileName, subjectId) => {
  const file = xlsx.parse(path.resolve(__dirname, "../../uploads", fileName));
  const belongsTable = {};
  const raw = file.reduce((prev, current) => {
    return [
      ...prev,
      ...(current.data || []).flatMap((item, index) => {
        item[5] = String(item[5]);
        if (index === 0) return [];
        const id = Util.hashString(item[2]);
        if (!belongsTable[item[0]]) belongsTable[item[0]] = [];
        belongsTable[item[0]].push(id);

        return {
          title: item[2],
          right: JSON.stringify(
            String(item[6]) === "2"
              ? [item[3] === "A" ? "FALSE" : "TRUE"]
              : String(item[3]).split("")
          ),
          type:
            String(item[6]) === "2"
              ? "trueFalse"
              : item[3].split("").length === 1
              ? "single"
              : "multi",
          detail: JSON.stringify(
            ["A", "B", "C", "D"].reduce((prev, choice, i) => {
              return {
                ...prev,
                [choice]: String(item[i + 7]).trim(),
              };
            }, {})
          ),
          usage: Math.random() > 0.5,
          enable: true,
          id,
          difficult: item[5],
        };
      }),
    ];
  }, []);
  await Question.bulkCreate(raw, {
    updateOnDuplicate: ["id"],
  });
  const targetSubject = await Subject.model.findOne({
    where: { id: subjectId },
  });

  const chapterNames = Object.keys(belongsTable);
  for (let i = 0; i < chapterNames.length; i++) {
    const chapterName = chapterNames[i];

    const targetChapter = await targetSubject.getChapters({
      where: { name: chapterName },
    });
    let theChapter;
    if (targetChapter.length === 0) {
      theChapter = await Chapter.create(
        chapterName,
        targetSubject.dataValues.id
      );
    } else {
      theChapter = targetChapter[0];
    }

    await theChapter.addQuestions(
      await Question.findAll({
        where: { id: { [Sequelize.Op.in]: belongsTable[chapterName] } },
      })
    );
  }
  return;
  // await targetChapter.addQuestions(questions);
};

exports.model = Question;
