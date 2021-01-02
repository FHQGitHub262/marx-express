const Sequelize = require("sequelize");
const { dialect, database, username, password, host, port } = require("../config");
console.log("[ORM]", "Init sequelize...", `${dialect}://${username}:${password}@${host}/${database}`);


let sequelize
try {
  sequelize = new Sequelize(
    database,username,password,
    {
      dialect,
      host,
      port,
      pool: {
        max: 5,
        min: 0,
        idle: 30000,
      },
      timezone: "+08:00",
      logging: false,
    },
  );
} catch (error) {
  console.log(error)
}


module.exports = sequelize;
