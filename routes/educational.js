var express = require("express");
var router = express.Router();

router.get("/teachers", (req, res) => {
  console.log(req.query, req.session);
  res.json({
    success: true,
    data: [
      {
        id: 1,
        name: "测试教师"
      }
    ]
  });
});

router.get("/subjects", (req, res) => {
  console.log(req.query, req.session);
  res.json({
    success: true,
    data: [
      {
        id: 1,
        name: "TEST SUBJECT",
        chapterNum: 12,
        questionNum: 12
      }
    ]
  });
});

router.get("/courses", (req, res) => {
  console.log(req.query, req.session);
  res.json({
    success: true,
    data: [
      {
        id: 1,
        name: "测试课程",
        count: 45,
        status: "active"
      }
    ]
  });
});

router.get("/chapters", (req, res) => {
  console.log(req.query, req.session);
  res.json({
    success: true,
    data: [
      {
        id: 1,
        name: "测试章节"
      }
    ]
  });
});

router.get("/questions", (req, res) => {
  console.log(req.query, req.session);
  res.json({
    success: true,
    data: [
      {
        id: 1,
        name: "树上一个猴，树下七个猴",
        type: "选择题"
      }
    ]
  });
});

router.get("/exams", (req, res) => {
  console.log(req.query, req.session);
  res.json({
    success: true,
    data: [
      {
        id: 1,
        name: "期末考试",
        count: 47,
        startAt: new Date().getTime(),
        type: "exam",
        status: "before"
      }
    ]
    //   statistics: {
    //     average: 78,
    //     max: 99
    //   }
    // }
  });
});

module.exports = router;
