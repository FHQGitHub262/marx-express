const path = require("path");
const sequelize = require("../db");
const Sequelize = require("sequelize");
const Util = require(path.resolve(__dirname, "../util"));

class College extends Sequelize.Model {}
College.init(
  {
    name: Sequelize.STRING(100),
    id: {
      type: Sequelize.STRING(100),
      primaryKey: true,
      unique: true
    },
    majorNum: Sequelize.INTEGER()
  },
  { sequelize, modelName: "College" }
);

exports.createCollege = name => {
  return College.create({
    name,
    id: Util.uuid(),
    majorNum: 0
  });
};

exports.getAll = () => {
  return College.findAll({
    order: [["createdAt", "ASC"]],
  });
};

exports.model = College;
