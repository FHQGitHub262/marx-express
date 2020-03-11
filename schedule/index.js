var redis = require("redis");

const config = require("../config").redis;
let eventTable = {};

// 创建一个用于订阅通知的client
const subscriberClient = redis.createClient(config);
subscriberClient.psubscribe("__keyevent@0__:expired");

// 创建一个用于存放调度的队列的client
const schedQueueClient = redis.createClient(config);
subscriberClient.on("pmessage", function(pattern, channel, expiredKey) {
  console.log("pmessage");
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

const emit = (eventName, data) => {
  const handlers = eventTable[eventName] || [];
  if (handlers.length === 0) log("Unknow event", `"${eventName}"`);
  handlers.forEach(foo => foo(data));
};

const log = (...args) => {
  console.log.apply({}, ["[Schedule]", new Date(), ...args]);
};

// this.addEventListener("test", data => {
//   console.log("test");
// });
// this.scheduleToDo("test", new Date().getTime() + 5000);
