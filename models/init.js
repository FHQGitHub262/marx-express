const model = require("./");
const link = require("./db");

const init = async () => {
  /* 用户关系 */
  // Student是一种User
  model.Student.belongsTo(model.User);
  // Teacher也是一种User
  model.Teacher.belongsTo(model.User);

  /* 学籍线 */
  // College包含多个Major
  model.College.hasMany(model.Major);
  // Major包含多个Administration Class
  model.Major.hasMany(model.AdministrationClass);
  // Administration Class包含多个Student
  model.AdministrationClass.hasMany(model.Student);

  /* 教学线 */
  // 教学班只对应一个课程
  model.Course.hasOne(model.Subject);
  // 课程具有多个章节
  model.Subject.hasMany(model.Chapter);
  // 问题和章节之间保持多对多关系，为后续预留操作空间
  model.Question.belongsToMany(model.Chapter, {
    through: "ChapterQuestion"
  });
  // 学生可以加入多个教学班
  model.Course.belongsToMany(model.Student, { through: "JoinCourse" });
  // 老师可以负责多个教学班
  model.Course.belongsToMany(model.Teacher, { through: "GrantCourse" });

  /* 考试线 */
  // 一次考试会组织多个教学班
  model.Exam.belongsToMany(model.Course, { through: "ExamPlan" });
  // 学生参加考试的记录
  model.Exam.belongsToMany(model.Student, { through: "StudentExam" });
  // 一次考试对应一个试卷
  model.Exam.hasOne(model.Paper, { through: "ExamPaper" });
  // 学生作答与试卷相关，与试卷无关
  model.Paper.belongsToMany(model.Student, { through: "AnswerExam" });
  // 一份试卷由多个题目组成
  model.Paper.belongsToMany(model.Question, { through: "PaperMakeUp" });

  await link.sync();
  console.log("Sync db ok.");
  process.exit(0);
};

init();
