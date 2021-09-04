const path = require("path");
const sequelize = require("../db");
const Sequelize = require("sequelize");
const College = require("./College");
const Util = require(path.resolve(__dirname, "../util"));

class Major extends Sequelize.Model {}
Major.init(
  {
    name: Sequelize.STRING(100),
    id: {
      type: Sequelize.STRING(100),
      primaryKey: true,
      unique: true
    }
  },
  { sequelize, modelName: "Major" }
);

exports.createMajor = async (name, collegeId) => {
  const college = await College.model.findOne({
    where: {
      id: collegeId
    }
  });
  await college.update({
    majorNum: college.dataValues.majorNum + 1
  });
  const major = await college.createMajor({
    name,
    id: Util.uuid()
  });
  return major;
  // major.setMajor()
};

exports.getAll = async collegeId => {
  const college = await College.model.findOne({
    where: {
      id: collegeId
    },
    order: [["createdAt", "DESC"]],
  });
  if (!college) {
    return [];
  }
  return college.getMajors();
};

exports.model = Major;
