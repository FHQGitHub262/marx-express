const uuidv1 = require("uuid/v4");
const fs = require("fs");
const path = require("path");
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

exports.arrayGroupBy = function groupBy(array, f) {
  let groups = {};
  array.forEach(elem => {
    const type = String(f(elem));
    if (groups[type] === undefined) [(groups[type] = [])];
    groups[type].push(elem);
  });
  return groups;
};

exports.arrayRandomPick = (array, targetLength) => {
  if (targetLength > array.length) {
    return [];
  } else if (targetLength === array.length) {
    return array;
  }
  let resultIndex = [];
  let result = [];
  while (result.length < targetLength) {
    let newIndex = Math.floor(Math.random() * array.length);
    while (resultIndex.indexOf(newIndex) >= 0) {
      newIndex = Math.floor(Math.random() * array.length);
    }
    resultIndex.push(newIndex);
    result.push(array[newIndex]);
  }
  return result;
};

/**
 * 读取路径信息
 * @param {string} path 路径
 */
function getStat(path) {
  return new Promise((resolve, reject) => {
    fs.stat(path, (err, stats) => {
      if (err) {
        resolve(false);
      } else {
        resolve(stats);
      }
    });
  });
}

/**
 * 创建路径
 * @param {string} dir 路径
 */
function mkdir(dir) {
  return new Promise((resolve, reject) => {
    fs.mkdir(dir, err => {
      if (err) {
        resolve(false);
      } else {
        resolve(true);
      }
    });
  });
}

/**
 * 路径是否存在，不存在则创建
 * @param {string} dir 路径
 */
exports.dirExists = async function dirExists(dir) {
  let isExists = await getStat(dir);
  //如果该路径且不是文件，返回true
  if (isExists && isExists.isDirectory()) {
    return true;
  } else if (isExists) {
    //如果该路径存在但是文件，返回false
    return false;
  }
  //如果该路径不存在
  let tempDir = path.parse(dir).dir; //拿到上级路径
  //递归判断，如果上级目录也不存在，则会代码会在此处继续循环执行，直到目录存在
  let status = await dirExists(tempDir);
  let mkdirStatus;
  if (status) {
    mkdirStatus = await mkdir(dir);
  }
  return mkdirStatus;
};
