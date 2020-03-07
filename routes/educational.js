var express = require("express");
var router = express.Router();

const Teacher = require("../models/models/Teacher");
const Subject = require("../models/models/Subject");
const Course = require("../models/models/Course");
const Chapter = require("../models/models/Chapter");
const Question = require("../models/models/Question");
const Student = require("../models/models/Student");
const Exam = require("../models/models/Exam");

router.get("/teachers", async (req, res) => {
  try {
    if (!req.session.user) throw new Error("未登录");
    const query = await Teacher.getAll();
    // console.log(req.query, req.session);
    const data = (query || []).map(teacherInfo => {
      return teacherInfo.dataValues || {};
    });
    res.json({
      success: true,
      data
    });
  } catch (e) {
    console.log(e);
    res.json({
      success: false,
      data: []
    });
  }
});

router.post("/createTeacher", async (req, res) => {
  console.log(req.body);
  const query = await Teacher.createTeacher(
    req.body.password,
    req.body.id,
    req.body.name
  );
  // console.log(query);
  res.json({
    success: true,
    data: query.dataValues
  });
});

router.get("/subjects", async (req, res) => {
  try {
    let query = await Subject.getAll();

    res.json({
      success: true,
      data: query.map(subject => subject.dataValues)
    });
  } catch (error) {
    console.log(error);
    res.json({ success: false });
  }
});

router.post("/createSubject", async (req, res) => {
  console.log(req.body);
  const query = await Subject.create(req.body.name);
  // console.log(query);
  res.json({
    success: true,
    data: query.dataValues
  });
});

router.get("/students", async (req, res) => {
  const course = await Course.model.findOne({
    where: {
      id: req.query.id
    }
  });
  console.log(course);

  res.json({
    success: true,
    data: (await course.getStudents()).map(item => item.dataValues)
  });
});

router.get("/courses", async (req, res) => {
  let course;
  if (req.session.user.privilege.indexOf("admin") >= 0) {
    course = await Course.getAll(req.body.id);
  } else {
    console.log("unadmin", req.session.user);
    course = await Course.getAllForTeacher(req.body.id, req.session.user.uuid);
  }
  res.json({
    success: true,
    data: course.map(item => item.dataValues)
  });
});

router.post("/createCourse", async (req, res) => {
  // #TODO: 加入学生选择
  console.log("here", req.body);
  // 创建课程本身
  const course = await Course.create(req.body.name, req.body.subject);
  console.log(course);
  // 加入学生
  const query = await Course.addStudents(
    course.dataValues.id,
    req.body.studentList || []
  );
  // 加入教师
  const grantTeacher = await Course.grantTo(course.dataValues.id, [
    req.body.teacher
  ]);
  console.log(query);
  res.json({
    success: true,
    data: query.dataValues
  });
});

router.post("/grantCourse", async (req, res) => {
  try {
    const grantTeacher = await Course.grantBatchTo(req.body.course, [
      req.body.teacher
    ]);
    res.json({ success: true });
  } catch (error) {
    console.log(error);
    res.json({
      success: false
    });
  }
});

router.get("/chapters", async (req, res) => {
  console.log(req.query, req.session);
  const query = await Chapter.getAll(req.query.id);
  res.json({
    success: true,
    data: query.map(item => item.dataValues)
  });
});

router.post("/createChapter", async (req, res) => {
  console.log(req.body);
  const query = await Chapter.create(req.body.name, req.body.subject);
  console.log(query);
  res.json({
    success: true,
    data: query.dataValues
  });
});

router.get("/questions", async (req, res) => {
  res.json({
    success: true,
    data: await Question.getAll(req.query.id, req.query.type || undefined)
  });
});

router.get("/exams", async (req, res) => {
  res.json({
    success: true,
    data: (await Exam.getAll()).map(res => res.dataValues)
    //   statistics: {
    //     average: 78,
    //     max: 99
    //   }
    // }
  });
});

router.post("/createExam", async (req, res) => {
  res.json({
    success: true,
    data: await Exam.create(req.body)
  });
});

module.exports = router;
