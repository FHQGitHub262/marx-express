var express = require("express");
var router = express.Router();
const path = require("path");

const User = require("../models/models/User");
const Student = require("../models/models/Student");
const Course = require("../models/models/Course");
const Exam = require("../models/models/Exam");
const cache = require("../models/cache");
const Question = require("../models/models/Question");
const Sequelize = require("sequelize");

router.get("/courses", async (req, res) => {
  try {
    res.json({
      success: true,
      data: await Student.getCourse(req.session.user.uuid),
    });
  } catch (error) {
    console.log(error);
    res.json({ success: false });
  }
});

router.get("/exams", async (req, res) => {
  const theExams = await Student.getExams(req.session.user.uuid, req.query.id);
  console.log(theExams[0].dataValues.AnswerExam);
  res.json({
    success: true,
    data: theExams.map((item) => ({
      ...item.dataValues,
      status: item.dataValues.AnswerExam.status,
    })),
  });
});

router.get("/paper", async (req, res) => {
  try {
    const exam = req.query.id;
    const answerCache = await cache.hashGet(exam, [
      req.session.user.uuid,
      `${req.session.user.uuid}_sum`,
    ]);

    console.log(answerCache);
    let paper
    try {
      paper = require(path.resolve(
        __dirname,
        `../public/temp/${exam}/${req.session.user.uuid}.json`
      ));
    } catch (error) {
      paper = { exam: {}, paper: { "single": [], "multi": [], "trueFalse": [] } }
    }


    res.json({
      ...paper,
      current: answerCache[req.session.user.uuid],
      sum: parseInt(answerCache[`${req.session.user.uuid}_sum`] || "0"),
    });

    cache.hashSet(exam, {
      [`${req.session.user.uuid}_sync`]: Date.now(),
    });
  } catch (e) {
    console.log(e);
    res.json({
      success: false,
    });
  }
});

router.post("/backup", async (req, res) => {
  let backupValue = {};

  const answerCache = await cache.hashGet(req.body.exam, [
    `${req.session.user.uuid}_sync`,
    `${req.session.user.uuid}_sum`,
  ]);

  const sync = parseInt(answerCache[`${req.session.user.uuid}_sync`]);
  const sum = parseInt(answerCache[`${req.session.user.uuid}_sum`]);
  console.log(sync, Date.now());
  backupValue[req.session.user.uuid] = JSON.stringify(req.body.data);
  backupValue[`${req.session.user.uuid}_sync`] = Date.now();
  backupValue[`${req.session.user.uuid}_sum`] = Date.now() - sync + (sum || 0);

  cache.hashSet(req.body.exam, backupValue);
  res.json({
    success: true,
  });
});

router.post("/finishup", async (req, res) => {
  await Exam.finishup(req.body.exam, req.session.user.uuid, req.body.data);

  res.json({
    success: true,
    answer: await Question.getAnswers(req.body.list),
  });
});

router.get("/review", async (req, res) => {
  try {
    const theExams = await Exam.model.findOne({
      where: {
        id: req.query.exam,
      },
    });
    const review = await Exam.getReview(req.query.exam, req.session.user.uuid);
    const raw = JSON.parse(review[0].raw);

    console.log(review, raw);

    const questions = await Question.model.findAll({
      attributes: ["id", "title", "right", "detail"],
      where: {
        id: {
          [Sequelize.Op.in]: Object.values(raw).reduce(
            (prev, item) => [...prev, ...Object.keys(item)],
            []
          ),
        },
      },
    });
    res.json({
      success: true,
      data: { raw, questions, exam: theExams.dataValues },
    });
    // res.json({
    //   success: true,
    //   data: {},
    // });
  } catch (error) {
    console.log(error);
    res.json({
      success: false,
    });
  }
});

router.post("/password/reset", async (req, res) => {
  try {
    if (req.session.user.passwd === req.body.now) {
      // console.log(req.body.now);
      await User.changePassword(req.session.user.uuid, req.body.next);

      res.json({ success: true });
    } else {
      // console.log("here", req.session.user.passwd, req.body.now);
      res.json({ success: false, ret: "现密码不正确" });
    }
  } catch (error) {
    console.log(error);
    res.json({
      success: false,
      ret: "服务器忙碌，请稍后再试",
    });
  }
});

router.post("/report", async (req, res) => {
  try {
    console.log(req.session.user);

    const [theStudent, theExam] = await Promise.all([
      Student.model.findOne({ where: { UserUuid: req.session.user.uuid } }),
      Exam.model.findOne({ where: { id: req.body.exam } }),
    ]);
    await theExam.addStudent(theStudent, {
      through: {
        raw: JSON.stringify(req.body.raw),
        status: "FIN",
        grade: req.body.grade,
      },
    });
    res.json({
      success: true,
    });
  } catch (error) {
    res.json({
      success: false,
    });
  }
});

router.get('/time', async (req, res) => {
  res.json({
    success: true,
    data: Date.now()
  });
})

module.exports = router;
