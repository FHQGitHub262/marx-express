const fs = require("fs");
const path = require("path");
const Task = require("./index");
const cache = require("../models/cache");

const Exam = require("../models/models/Exam");
// 备卷
Task.addEventListener("prepare_exam", (data) => {
  data = JSON.parse(data);
  console.log("Prepare", new Date(), data);
  Exam.prepare(data.id);
});

// 清理考试存储
Task.addEventListener("cleanup_exam", (data) => {
  data = JSON.parse(data);
  // 删除缓存的卷子
  // require("../models/util").rmdir(
  //   path.resolve(__dirname, "../public/temp", `./${data.id}`)
  // );
  // 删除redis的内容，内存中的答卷缓存
  cache.hashDel(data.id);
});

// 判卷
Task.addEventListener("judge_exam", (data) => {
  Exam.judge(data.id);
});
