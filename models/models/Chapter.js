const path = require("path");
const sequelize = require("../db");
const Sequelize = require("sequelize");
const Util = require(path.resolve(__dirname, "../util"));

const Subject = require("./Subject");

class Chapter extends Sequelize.Model {}
Chapter.init(
  {
    name: Sequelize.STRING(100),
    id: {
      type: Sequelize.STRING(100),
      primaryKey: true,
      unique: true,
    },
  },
  { sequelize, modelName: "Chapter" }
);

exports.create = async (name, subjectId) => {
  const subject = await Subject.model.findOne({
    where: {
      id: subjectId,
    },
  });
  await subject.update({
    majorNum: subject.dataValues.majorNum + 1,
  });
  return await subject.createChapter({
    name,
    id: Util.uuid(),
  });
};

exports.getAll = async (subjectId) => {
  const subject = await Subject.model.findOne({
    where: {
      id: subjectId,
    },
    order: [["createdAt", "ASC"]],
  });
  return await subject.getChapters();
};
exports.model = Chapter;
