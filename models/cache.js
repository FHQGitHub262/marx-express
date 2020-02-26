const redis = require("redis");
const client = redis.createClient(require("../config").redis);

const log = (...args) => {
  console.log.apply({}, ["[Redis]", ...args]);
};

client.on("error", err => {
  console.log("Error " + err);
});

client.on("connect", async e => {
  log("Connect");
  hashGet("776c8630-561e-11ea-bac0-ff7f14b2e569").then(res => log(res));
  // set("test", "123456").then(res => log(res));
  // get("test").then(res => log(res));
  // hashSet("examId", {
  //   student1: JSON.stringify({
  //     aaa: "111"
  //   }),
  //   student2: JSON.stringify({
  //     aaa: "222"
  //   })
  // }).then(res => log(res));
  // hashGet("examId", ["student1", "student2"]).then(res => log(res));
});

const set = (key, value) => {
  return new Promise((resolve, reject) => {
    client.set(key, value, (err, reply) => {
      if (err) {
        reject(err);
      }
      resolve(reply);
    });
  });
};

const hashSet = (key, value) => {
  return new Promise((resolve, reject) => {
    client.hmset(key, value, (err, reply) => {
      if (err) {
        reject(err);
      }
      resolve(reply);
    });
  });
};

const hashGet = (key, fields = []) => {
  return new Promise((resolve, reject) => {
    if (fields.length > 0) {
      client.hmget(key, fields, (err, reply) => {
        if (err) {
          reject(err);
        }
        let result = {};
        fields.map((item, index) => {
          result[item] = reply ? reply[index] : undefined;
        });
        resolve(result);
      });
    } else {
      client.hgetall(key, (err, reply) => {
        if (err) {
          reject(err);
        }
        resolve(reply);
      });
    }
  });
};

const get = key => {
  return new Promise((resolve, reject) => {
    client.get(key, (err, value) => {
      if (err) reject(err);
      resolve(value);
    });
  });
};

exports.hashGet = hashGet;
exports.hashSet = hashSet;
exports.set = set;
exports.get = get;
exports.client = client;
