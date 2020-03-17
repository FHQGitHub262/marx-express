var redis = require("ioredis");

const config = require("../config");
let eventTable = {};

let testKey;

// 创建一个用于订阅通知的client
const subscriberClient = redis.createClient(config.redis);
subscriberClient.psubscribe("__keyevent@0__:expired");

// 创建一个用于存放调度的队列的client
const schedQueueClient = redis.createClient(config.redis);
subscriberClient.on("pmessage", function(pattern, channel, expiredKey) {
  if (expiredKey.indexOf("session" === 0)) return;
  console.log("pmessage", expiredKey);
  const { event, data } = JSON.parse(expiredKey);
  emit(event, data);
  //TODO: push expiredKey onto some other list to proceed to order fulfillment
});

exports.addEventListener = (eventName, handler) => {
  if (typeof handler !== "function") return;
  if (eventTable[eventName] !== undefined) {
    eventTable.push(handler);
  } else {
    eventTable[eventName] = [handler];
  }
  log("Add eventListener", `"${eventName}"`);
};

exports.scheduleToDo = (emitEvent, emitTime, emitData = "") => {
  const now = new Date().getTime();
  let schedule;

  if (typeof emitTime === "number") {
    schedule = emitTime;
  } else if (emitTime instanceof Date) {
    schedule = emitTime.getTime();
  } else {
    console.log("here");
    return;
  }
  // 未来
  if (now < schedule) {
    testKey = JSON.stringify({
      event: emitEvent,
      data: emitData,
      time: schedule
    });
    schedQueueClient.set(
      JSON.stringify({ event: emitEvent, data: emitData, time: schedule }),
      "",
      "PX",
      schedule - now,
      () => {
        log("Add schedule", `"${emitEvent}" at ${new Date(schedule)}`);
      }
    );
  }
  // 过去, 直接执行
  else emit(emitEvent, emitData);
};

exports.cancelToDo = (emitEvent, emitTime, emitData = "") => {
  const now = new Date().getTime();
  let schedule;

  if (typeof emitTime === "number") {
    schedule = emitTime;
  } else if (emitTime instanceof Date) {
    schedule = emitTime.getTime();
  } else {
    return;
  }
  // 未来
  if (now < schedule) {
    schedQueueClient.del(
      JSON.stringify({ event: emitEvent, data: emitData, time: schedule })
    );
  }
};

const emit = (eventName, data) => {
  console.log("[Schedule]", "Emit Event", eventName, "with", data);
  const handlers = eventTable[eventName] || [];
  if (handlers.length === 0) log("Unknow event", `"${eventName}"`);
  handlers.forEach(foo => foo(data));
};

const log = (...args) => {
  console.log.apply({}, ["[Schedule]", new Date(), ...args]);
};

// 心跳
setInterval(() => {
  schedQueueClient.set("schedQueueTick", new Date().toLocaleString());
}, 1000 * config.redisTick);

subscriberClient.on("error", err => {
  console.log("[Schedule]", err);
});

// this.addEventListener("test", data => {
//   console.log("test");
// });
// const scheduleTime = new Date().getTime() + 10000;
// this.scheduleToDo("test", scheduleTime);
// setTimeout(() => {
//   this.cancelToDo("test", scheduleTime);
// }, 1000);
