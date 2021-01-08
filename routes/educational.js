var express = require("express");
var router = express.Router();
var contentDisposition = require("content-disposition");

const Sequelize = require("sequelize");

const Teacher = require("../models/models/Teacher");
const Subject = require("../models/models/Subject");
const Course = require("../models/models/Course");
const Chapter = require("../models/models/Chapter");
const Question = require("../models/models/Question");
const Student = require("../models/models/Student");
const Exam = require("../models/models/Exam");
const { Router } = require("express");

router.get("/teachers", async (req, res) => {
  try {
    if (!req.session.user) throw new Error("未登录");
    const query = await Teacher.getAll();
    // console.log(req.query, req.session);
    const data = (query || []).map((teacherInfo) => {
      return teacherInfo.dataValues || {};
    });
    res.json({
      success: true,
      data,
    });
  } catch (e) {
    console.log(e);
    res.json({
      success: false,
      data: [],
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
    data: query.dataValues,
  });
});

router.get("/subjects", async (req, res) => {
  try {
    if (req.session.user.privilege.indexOf("admin") < 0) {
      res.json({
        success: true,
        data: (await Subject.getAllForTeacher(req.session.user.uuid)).map(
          (item) => item.dataValues
        ),
      });
    } else {
      let query = await Subject.getAll();

      res.json({
        success: true,
        data: query.map((subject) => subject.dataValues),
      });
    }
  } catch (error) {
    console.log(error);
    res.json({ success: false });
  }
});

router.post("/createSubject", async (req, res) => {
  console.log(req.body);
  const query = await Subject.create(req.body.name, req.body.pic);
  // console.log(query);
  res.json({
    success: true,
    data: query.dataValues,
  });
});

router.get("/students", async (req, res) => {
  const course = await Course.model.findOne({
    where: {
      id: req.query.id,
    },
  });

  res.json({
    success: true,
    data: (await course.getStudents()).map((item) => item.dataValues),
  });
});

router.get("/courses", async (req, res) => {
  try {
    let course;
    if (req.query.id === "") {
      res.json({
        success: true,
        data: [],
      });
    } else if (req.session.user.privilege.indexOf("admin") >= 0) {
      console.log(req.query.id);
      course = await Course.getAll(req.query.id);
    } else {
      console.log("unadmin", req.session.user);
      course = await Course.getAllForTeacher(
        req.query.id,
        req.session.user.uuid
      );
    }
    res.json({
      success: true,
      data: course.map((item) => item.dataValues),
    });
  } catch (error) {
    res.json({
      success: false,
    });
  }
});

router.get("/course/detail", async (req, res) => {
  try {
    res.json({
      success: true,
      data: await Course.detail(req.query.id),
    });
  } catch (error) {
    console.log(error);
    res.json({
      success: false,
    });
  }
});

router.post("/course/fire", async (req, res) => {
  try {
    await Course.setStatus(req.body.range, "active");
    res.json({
      success: true,
    });
  } catch (error) {
    console.log(error);
    res.json({
      success: false,
    });
  }
});

router.post("/course/end", async (req, res) => {
  try {
    await Course.setStatus(req.body.range, "end");
    res.json({
      success: true,
    });
  } catch (error) {
    console.log(error);
    res.json({
      success: false,
    });
  }
});

router.post("/createCourse", async (req, res) => {
  // #TODO: 加入学生选择

  // 创建课程本身
  const course = await Course.create(req.body.name, req.body.subject);

  // 加入学生
  const query = await Course.addStudents(
    course.dataValues.id,
    req.body.studentList || []
  );
  // 加入教师
  const grantTeacher = await Course.grantTo(course.dataValues.id, [
    req.body.teacher,
  ]);

  res.json({
    success: true,
    data: query.dataValues,
  });
});

router.post("/updateCourse", async (req, res) => {
  try {
    // 修改课程本身
    const course = await Course.model.findOne({
      where: { id: req.body.id },
    });
    course.update({
      name: req.body.name,
    });

    const [students = [], teachers = []] = await Promise.all([
      Student.model.findAll({
        where: { UserUuid: { [Sequelize.Op.in]: req.body.studentList } },
      }),
      Teacher.model.findAll({
        where: { UserUuid: { [Sequelize.Op.in]: [req.body.teacher] } },
      }),
    ]);

    await Promise.all([course.setStudents([]), await course.setTeachers([])]);

    await Promise.all([
      course.addStudents(students),
      course.addTeachers(teachers),
    ]);
    // await course.setStudents(students);

    res.json({
      success: true,
    });
  } catch (error) {
    console.log(error);
    res.json({
      success: false,
    });
  }
});

router.post("/grantCourse", async (req, res) => {
  try {
    const grantTeacher = await Course.grantBatchTo(req.body.course, [
      req.body.teacher,
    ]);
    res.json({ success: true });
  } catch (error) {
    console.log(error);
    res.json({
      success: false,
    });
  }
});

router.get("/chapters", async (req, res) => {
  try {
    if (req.query.id === "") {
      res.json({
        success: true,
        data: [],
      });
    } else {
      const query = await Chapter.getAll(req.query.id);
      res.json({
        success: true,
        data: query.map((item) => item.dataValues),
      });
    }
  } catch (error) {
    res.json({
      success: false,
    });
  }
});

router.post("/createChapter", async (req, res) => {
  const query = await Chapter.create(req.body.name, req.body.subject);

  res.json({
    success: true,
    data: query.dataValues,
  });
});

router.get("/questions", async (req, res) => {
  res.json({
    success: true,
    data: await Question.getAll(
      req.query.id,
      req.query.type || undefined,
      req.query.forceEnabled,
      req.query.forExam || "",
      req.query.page || -1
    ),
    total: await Question.countAll(
      req.query.id,
      req.query.type || undefined,
      req.query.forceEnabled,
      req.query.forExam || ""
    ),
  });
});

router.post("/question/enable", async (req, res) => {
  try {
    await Question.setEnable(req.body.range);
    res.json({
      success: true,
    });
  } catch (error) {
    console.log(error);
    res.json({
      success: false,
    });
  }
});

router.post("/question/disable", async (req, res) => {
  try {
    await Question.setDisable(req.body.range);
    res.json({
      success: true,
    });
  } catch (error) {
    console.log("error", error);
    res.json({
      success: false,
    });
  }
});

router.post("/questions/import", async (req, res) => {
  try {
    await Question.import(req.body.filename, req.body.subject);
    res.json({
      success: true,
    });
  } catch (error) {
    console.log(error);
    res.json({
      success: false,
    });
  }
});

router.post("/question/normal", async (req, res) => {
  try {
    await Question.setNormal(req.body.range);
    res.json({
      success: true,
    });
  } catch (error) {
    console.log("error", error);
    res.json({
      success: false,
    });
  }
});

router.post("/question/unnormal", async (req, res) => {
  try {
    await Question.setUnNormal(req.body.range);
    res.json({
      success: true,
    });
  } catch (error) {
    console.log("error", error);
    res.json({
      success: false,
    });
  }
});

router.post("/question/edit", async (req, res) => {
  try {
    const { id, title, right, detail, difficult } = req.body;
    await Question.model.update(
      { id, title, right, detail, difficult },
      { where: { id } }
    );
    res.json({
      success: true,
    });
  } catch (error) {
    res.json({ success: false });
  }
});

router.get("/exams", async (req, res) => {
  try {
    if (req.session.user.privilege.indexOf("admin") > 0) {
      res.json({
        success: true,
        data: (
          await Exam.getAll(
            req.query.id || "",
            JSON.parse(req.query.range || "[]")
          )
        ).map((res) => res.dataValues),
      });
    } else {
      res.json({
        success: true,
        data: (
          await Exam.getAllForTeacher(
            req.session.user.uuid,
            req.query.id || "",
            JSON.parse(req.query.range || "[]")
          )
        ).map((res) => res.dataValues),
      });
    }
  } catch (error) {
    console.log(error);
    res.json({
      success: false,
    });
  }
});

router.post("/exam/prepare", async (req, res) => {
  try {
    await Exam.prepare(req.body.id);
    res.json({ success: true });
  } catch (error) {
    res.json({ success: false });
  }
});

router.post("/exam/judge", async (req, res) => {
  try {
    await Exam.judge(req.body.id);
    res.json({ success: true });
  } catch (error) {
    res.json({ success: false });
  }
});

router.get("/exam/galance", async (req, res) => {
  try {
    res.json({
      success: true,
      data: await Exam.galance(req.query.id),
    });
  } catch (error) {
    console.log(error);
    res.json({
      success: false,
    });
  }
});

router.get("/exam/export", async (req, res) => {
  try {
    const { buf, name } = await Exam.output(req.query.id);
    res
      .set(
        "Content-Disposition",
        "attachment;filename=" +
        require("urlencode")(`${name || "考试详情"}.xlsx`, "utf-8")
      )
      .send(buf);
  } catch (error) {
    console.log(error);
    res.status("500").end();
  }
});

router.get("/exam/batchexport", async (req, res) => {
  try {
    const { buf, name } = await Exam.batchoutput(req.query.id);
    res
      .set(
        "Content-Disposition",
        "attachment;filename=" +
        require("urlencode")(`${name || "考试详情"}.xlsx`, "utf-8")
      )
      .send(buf);
  } catch (error) {
    console.log(error);
    res.status("500").end();
  }
});

router.get("/exam/detail", async (req, res) => {
  try {
    res.json({
      success: true,
      data: await Exam.detail(req.query.id),
    });
  } catch (error) {
    console.log(error);
    return error;
  }
});

router.get('/exam/word', async (req, res) => {
  const { buffer, studentName, name } = await Exam.getDocx(req.query.id, req.query.userId)
  res
    .set(
      "Content-Disposition",
      "attachment;filename=" +
      require("urlencode")(`${studentName}-${name || "考试"}.docx`, "utf-8")
    )
    .end(buffer);
})

router.post("/createExam", async (req, res) => {
  res.json({
    success: true,
    data: await Exam.create(req.body),
  });
});

router.post("/updateExam", async (req, res) => {
  res.json({
    success: true,
    data: await Exam.update(req.body),
  });
});

module.exports = router;
