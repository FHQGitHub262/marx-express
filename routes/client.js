var express = require("express");
var router = express.Router();
const path = require("path");

const Student = require("../models/models/Student");
const Course = require("../models/models/Course");
const Exam = require("../models/models/Exam");
const cache = require("../models/cache");
const Question = require("../models/models/Question");
const Sequelize = require("sequelize");

router.get("/courses", async (req, res) => {
  console.log(req.session);

  res.json({
    success: true,
    data: await Student.getCourse(req.session.user.uuid)
  });
});

router.get("/exams", async (req, res) => {
  const theExams = await Student.getExams(req.session.user.uuid, req.query.id);
  res.json({
    success: true,
    data: theExams.map(item => item.dataValues)
  });
});

router.get("/paper", async (req, res) => {
  try {
    const exam = req.query.id;
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
  } catch (e) {
    console.log(e);
    res.json({
      success: false
    });
  }
});

router.post("/backup", async (req, res) => {
  let backupValue = {};
  backupValue[req.session.user.uuid] = JSON.stringify(req.body.data);
  cache.hashSet(req.body.exam, backupValue);
  res.json({
    success: true
  });
});

router.post("/finishup", async (req, res) => {
  Exam.finishup(req.body.exam, req.session.user.uuid, req.body.data);
  res.json({
    success: true
  });
});

router.get("/review", async (req, res) => {
  const theExams = await Exam.model.findOne({
    where: {
      id: req.query.exam
    }
  });
  const raw = JSON.parse(
    (await Exam.getReview(req.query.exam, req.session.user.uuid))[0].raw
  );
  const questions = await Question.model.findAll({
    attributes: ["id", "title", "right", "detail"],
    where: {
      id: {
        [Sequelize.Op.in]: Object.values(raw).map(item => Object.keys(item))
      }
    }
  });
  res.json({
    success: true,
    data: { raw, questions, exam: theExams.dataValues }
  });
});

module.exports = router;