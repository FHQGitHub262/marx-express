const path = require("path");
const sequelize = require(path.resolve(__dirname, "../db"));
const Sequelize = require("sequelize");
const Util = require(path.resolve(__dirname, "../util"));

class User extends Sequelize.Model {}
User.init(
  {
    uuid: {
      type: Sequelize.STRING(100),
      primaryKey: true,
      unique: true
    },
    passwd: Sequelize.STRING(100),
    idnumber: { type: Sequelize.INTEGER(4), unique: true },
    privilege: Sequelize.STRING(100),
    name: Sequelize.STRING(16)
  },
  { sequelize, modelName: "User" }
);

exports.createUser = (passwd, idnumber, privilege, name = "") => {
  return User.create({
    uuid: Util.uuid(),
    passwd,
    idnumber,
    privilege: JSON.stringify(privilege),
    name
  });
  // .then(res => console.log(res.dataValues))
  // .catch(e => console.log(e.sqlMessage, e.sqlState));
};

exports.login = async (idnumber, passwd) => {
  const res = await User.findOne({
    where: {
      idnumber,
      passwd
    }
  });
  // console.log(res);
  if (res && res.dataValues.passwd === passwd) {
    return [true, res.dataValues];
  } else {
    console.log(res.dataValues);
    return [false, {}];
  }
};

exports.resetPassword = uuid => {
  User.update(
    {
      passwd: "123456"
    },
    {
      where: {
        uuid
      }
    }
  ).then(res => console.log(res));
};

exports.updatePrivilege = async (newPrivilege, uuid) => {
  try {
    if (Util.checkPrivilege(newPrivilege)) {
      const theUser = await User.findOne({
        where: {
          uuid: uuid
        }
      });
      const res = await theUser.update({
        privilege: JSON.stringify(
          Array.from(
            new Set([
              ...JSON.parse(theUser.dataValues.privilege),
              ...newPrivilege
            ])
          )
        )
      });
      return true;
    } else {
      return false;
    }
  } catch (error) {
    console.log(error);
    return false;
  }
};

exports.model = User;
