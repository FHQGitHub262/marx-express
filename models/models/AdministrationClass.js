const sequelize = require("../db");
const Sequelize = require("sequelize");

class AdministrationClass extends Sequelize.Model {}
AdministrationClass.init(
  {
    name: Sequelize.STRING(100),
    id: {
      type: Sequelize.STRING(100),
      primaryKey: true,
      unique: true
    }
  },
  { sequelize, modelName: "AdministrationClass" }
);

module.exports = AdministrationClass;
