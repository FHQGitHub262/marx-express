const path = require("path");
const sequelize = require("../db");
const Sequelize = require("sequelize");
const Util = require(path.resolve(__dirname, "../util"));

const Teacer = require("./Teacher");

class Subject extends Sequelize.Model {}
Subject.init(
  {
    name: Sequelize.STRING(100),
    id: {
      type: Sequelize.STRING(100),
      primaryKey: true,
      unique: true
    },
    majorNum: {
      type: Sequelize.INTEGER()
    }
  },
  { sequelize, modelName: "Subject" }
);

exports.create = name => {
  return Subject.create({
    name,
    id: Util.uuid(),
    majorNum: 0
  });
};

exports.getAll = () => {
  return Subject.findAll({
    // attributes: ["id", "name"]
  });
};

exports.model = Subject;
