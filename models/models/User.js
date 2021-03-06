const path = require("path");
const sequelize = require(path.resolve(__dirname, "../db"));
const Sequelize = require("sequelize");
const { STRING } = require("sequelize");
const Util = require(path.resolve(__dirname, "../util"));

class User extends Sequelize.Model {}
User.init(
  {
    uuid: {
      type: Sequelize.STRING(100),
      primaryKey: true,
      unique: true,
    },
    passwd: Sequelize.STRING(100),
    idnumber: { type: STRING(100), unique: true },
    privilege: Sequelize.STRING(100),
    name: Sequelize.STRING(16),
  },
  { sequelize, modelName: "User" }
);

exports.createUser = async (passwd, idnumber, privilege, name = "") => {
  const user = await User.findOrCreate({
    where: {
      idnumber,
    },
    defaults: {
      uuid: Util.uuid(),
      passwd,
      idnumber,
      privilege: JSON.stringify(privilege),
      name,
    },
  });
  if (user instanceof Array) return user[0] || undefined;
  return user;
  // .then(res => console.log(res.dataValues))
  // .catch(e => console.log(e.sqlMessage, e.sqlState));
};

exports.login = async (idnumber, passwd) => {
  const res = await User.findOne({
    where: {
      idnumber,
      passwd,
    },
  });
  if (res && res.dataValues.passwd === passwd) {
    return [true, res.dataValues];
  } else {
    return [false, {}];
  }
};

exports.resetPassword = (uuid) => {
  User.update(
    {
      passwd: "123456",
    },
    {
      where: {
        uuid,
      },
    }
  ).then((res) => console.log(res));
};

exports.changePassword = (uuid, next) => {
  return User.update(
    {
      passwd: next,
    },
    { where: { uuid } }
  ).then((res) => {
    console.log(res);
    return res;
  });
};

exports.updatePrivilege = async (newPrivilege, uuid) => {
  try {
    if (Util.checkPrivilege(newPrivilege)) {
      const theUser = await User.findOne({
        where: {
          uuid: uuid,
        },
      });
      const res = await theUser.update({
        privilege: JSON.stringify(
          Array.from(
            new Set([
              ...JSON.parse(theUser.dataValues.privilege),
              ...newPrivilege,
            ])
          )
        ),
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
