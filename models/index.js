const link = require("./db");

const model = {
  User: require("./models/User"),
  Student: require("./models/Student"),
  Teacher: require("./models/Teacher"),
  Subject: require("./models/Subject"),
  Chapter: require("./models/Chapter"),
  Question: require("./models/Question"),
  Course: require("./models/Course"),
  College: require("./models/College"),
  AdministrationClass: require("./models/AdministrationClass"),
  Major: require("./models/Major"),
  Paper: require("./models/Paper"),
  Exam: require("./models/Exam")
};

model.Student.model.belongsTo(model.User.model);
// Teacher也是一种User
model.Teacher.model.belongsTo(model.User.model);

/* 学籍线 */
// College包含多个Major
model.College.model.hasMany(model.Major.model);
// Major包含多个Administration Class
model.Major.model.hasMany(model.AdministrationClass.model);
// Administration Class包含多个Student
model.AdministrationClass.model.hasMany(model.Student.model);

/* 教学线 */
// 教学班只对应一个课程
// model.Course.model.hasOne(model.Subject.model);
// model.Subject.model.hasMany(model.Course.model);
// model.Subject.model.belongsToMany(model.Course.model, {
//   through: "SelectSubject"
// });
// model.Course.model.belongsToMany(model.Subject.model, {
//   through: "SelectSubject"
// });
model.Subject.model.hasMany(model.Course.model);
// 课程具有多个章节
model.Subject.model.hasMany(model.Chapter.model);
// 问题和章节之间保持多对多关系，为后续预留操作空间
model.Question.model.belongsToMany(model.Chapter.model, {
  through: "ChapterQuestion"
});
model.Chapter.model.belongsToMany(model.Question.model, {
  through: "ChapterQuestion"
});

// 学生可以加入多个教学班
model.Course.model.belongsToMany(model.Student.model, {
  through: "JoinCourse"
  // otherKey: "userUuid"
});
model.Student.model.belongsToMany(model.Course.model, {
  through: "JoinCourse"
  // otherKey: "userUuid"
});
// 老师可以负责多个教学班
model.Course.model.belongsToMany(model.Teacher.model, {
  through: "GrantCourse"
});
// model.Teacher.model.belongsToMany(model.Course.model, {
//   through: "GrantCourse"
// });

/* 考试线 */
// 一次考试会组织多个教学班
model.Exam.model.belongsToMany(model.Course.model, { through: "ExamPlan" });
model.Course.model.belongsToMany(model.Exam.model, { through: "ExamPlan" });
// 学生参加考试的记录
model.Exam.model.belongsToMany(model.Student.model, { through: "StudentExam" });
model.Student.model.belongsToMany(model.Exam.model, { through: "StudentExam" });
// 一次考试对应一个试卷
model.Exam.model.belongsTo(model.Paper.model);
// 学生作答与试卷相关，与试卷无关
model.Paper.model.belongsToMany(model.Student.model, { through: "AnswerExam" });
// 一份试卷由多个题目组成
model.Question.model.belongsToMany(model.Paper.model, {
  through: "PaperMakeUp"
});
model.Paper.model.belongsToMany(model.Question.model, {
  through: "PaperMakeUp"
});

// link.sync();

module.exports = model;
