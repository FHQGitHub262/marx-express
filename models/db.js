const Sequelize = require("sequelize");
const { dialect, database, username, password, host } = require("../config");
console.log("[ORM]", "Init sequelize...");

const sequelize = new Sequelize(
  `${dialect}://${username}:${password}@${host}/${database}`,
  {
    pool: {
      max: 5,
      min: 0,
      idle: 30000
    },
    timezone: "+08:00",
    logging: false
  }
);

module.exports = sequelize;
