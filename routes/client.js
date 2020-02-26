var express = require("express");
var router = express.Router();
const path = require("path");

const Student = require("../models/models/Student");
const Course = require("../models/models/Course");
const cache = require("../models/cache");

router.get("/courses", async (req, res) => {
  console.log(req.session);

  res.json({
    success: true,
    data: await Student.getCourse(req.session.user.uuid)
  });
});

router.get("/exams", async (req, res) => {
  const theExams = await Course.getExams(req.query.id);
  res.json({
    success: true,
    data: theExams.map(item => item.dataValues)
  });
});

router.get("/paper", async (req, res) => {
  const exam = "776c8630-561e-11ea-bac0-ff7f14b2e569";
  const answerCache = await cache.hashGet(exam, [req.session.user.uuid]);
  console.log(answerCache);
  const paper = require(path.resolve(
    __dirname,
    `../public/temp/${exam}/${req.session.user.uuid}.json`
  ));
  res.json({
    ...paper,
    current: answerCache[req.session.user.uuid]
  });
});

router.post("/backup", async (req, res) => {
  let backupValue = {};
  backupValue[req.session.user.uuid] = JSON.stringify(req.body.data);
  cache.hashSet(req.body.exam, backupValue);
  res.json({
    success: true
  });
});

module.exports = router;
