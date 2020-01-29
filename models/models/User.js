const sequelize = require("../db");
const Sequelize = require("sequelize");

class User extends Sequelize.Model {}
User.init(
  {
    uuid: {
      type: Sequelize.STRING(100),
      primaryKey: true,
      unique: true
    },
    passwd: Sequelize.STRING(100),
    idnumber: Sequelize.INTEGER(4),
    privilege: Sequelize.STRING(100)
  },
  { sequelize, modelName: "User" }
);

module.exports = User;
