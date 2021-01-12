const path = require("path");
const sequelize = require("../db");
const Sequelize = require("sequelize");
const Util = require(path.resolve(__dirname, "../util"));

const Chapter = require("./Chapter");
const Subject = require("./Subject");
const xlsx = require("node-xlsx").default;

class Question extends Sequelize.Model { }
Question.init(
  {
    id: {
      type: Sequelize.STRING(100),
      primaryKey: true,
      unique: true,
    },
    title: Sequelize.TEXT,
    right: Sequelize.STRING(60),
    type: Sequelize.STRING(20),
    enable: Sequelize.BOOLEAN,
    detail: Sequelize.TEXT,
    // forExam
    usage: Sequelize.BOOLEAN,
    difficult: Sequelize.STRING(20),
  },
  { sequelize, modelName: "Question" }
);

Question.sync({ alter: true });

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

exports.setNormal = async (range) => {
  return await Question.update(
    {
      usage: false,
    },
    {
      where: { id: { [Sequelize.Op.in]: range } },
    }
  );
};

exports.setUnNormal = async (range) => {
  return await Question.update(
    {
      usage: true,
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

exports.getAll = async (
  chapterId,
  type,
  forceEnable = false,
  forExam = "",
  page = -1
) => {
  let limit = {};
  if (page >= 0) {
    (limit.limit = 50), (limit.offset = 50 * page);
  }
  const chapter = await Chapter.model.findOne({
    where: { id: chapterId },
    // attributes: ["id", "title", "type", "usage"]
  });

  let search = {};
  if (type) {
    search.type = type;
  }
  if (forExam !== "") {
    search.usage = forExam === "false" ? false : true;
  }

  if (forceEnable) {
    search.enable = true;
  }

  return chapter.getQuestions({ where: search, ...limit });
};

exports.countAll = async (
  chapterId,
  type,
  forceEnable = false,
  forExam = ""
) => {
  const chapter = await Chapter.model.findOne({
    where: { id: chapterId },
    // attributes: ["id", "title", "type", "usage"]
  });

  let search = {};
  if (type) {
    search.type = type;
  }
  if (forExam !== "") {
    search.usage = forExam === "false" ? false : true;
  }

  if (forceEnable) {
    search.enable = true;
  }

  return (await chapter.getQuestions({ where: search })).length;
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
    const data = (current.data || [])
      .filter(item => item.length && item.length > 0)
      .map((item, index) => {
        if (item.length === 0) return [];
        if (item.filter(elem => {
          const NOT_NULL = elem !== "" && elem !== undefined && elem !== null
          const NOT_EMPTY = typeof elem !== 'string' || elem.trim() !== ''
          return NOT_NULL && NOT_EMPTY
        }).length === 0) return [];
        console.log(item);
        if (index === 0) return [];

        const [column, _, title, rightAnswerRaw, __, difficulty, choiceNum] = item.map(col => {
          if (col.trim) return col.trim()
          return item
        })

        const id = Util.hashString(title);

        const rightAnswer = String(choiceNum) === "2"
          ? [rightAnswerRaw === "A" ? "TRUE" : "FALSE"]
          : String(rightAnswerRaw).split("")
            .filter(item => item)
            .filter(item => item.trim ? item.trim() : item)

        if (!belongsTable[column]) {
          belongsTable[column] = [];
        }
        belongsTable[column].push(id);

        return {
          id,
          title,
          right: JSON.stringify(rightAnswer),
          type:
            String(choiceNum) === "2"
              ? "trueFalse"
              : rightAnswer.length === 1
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
          usage: true,
          enable: true,
          difficult: difficulty,
        };
      })
      .reduce((prev, curr) => {
        if (curr instanceof Array) return prev;
        else {
          prev.push(curr);
          return prev;
        }
      }, []);

    return [...prev, ...data];
  }, []);

  console.log('raw', raw)

  // console.log((await Promise.all(
  //   Util.arraySlice(raw, 50).map((data) =>
  //     Question.bulkCreate(data, {
  //       updateOnDuplicate: ["title", "right", "detail", "type", 'usage'],
  //     })
  //   )
  // )).map(item => item.map(e => e._changed)));
  await Promise.all(raw.map(data => Question.upsert(data)))

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

exports.getAnswers = async (list) => {
  return await Question.findAll({
    where: {
      id: {
        [Sequelize.Op.in]: list,
      },
    },
    attributes: ["id", "right"],
  });
};

exports.model = Question;
