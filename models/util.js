const uuidv1 = require("uuid/v1");

exports.uuid = () => {
  return uuidv1();
};

exports.checkPrivilege = privilege => {
  if (!privilege instanceof Array) {
    return false;
  } else {
    const available = ["student", "admin", "teacher"];
    return !privilege.filter(elem => available.indexOf(elem) < 0).length > 0;
  }
};
