const {
  User,
  Teacher,
  Student,
  College,
  Major,
  AdministrationClass,
  Chapter,
  Subject,
  Course,
  Question,
  Paper,
  Exam,
} = require("./index");
const testCollege = "93d5db20-4406-11ea-962f-85630932b4e3";
const testMajor = "ac87e0a0-4406-11ea-bd9c-ad92072a80c2";
const testClass = "547bb590-44be-11ea-99ac-dbfc562210a2";
const testStudent = [
  "7f0dfc80-44d4-11ea-88a5-4f73f98121bc",
  "7f0f5c10-44d4-11ea-88a5-4f73f98121bc",
];
const testSubject = "63e69c20-44d2-11ea-a97d-39841d8140c6";
const testCourse = "f84fa9a0-44d3-11ea-b75c-43fdac80c98b";
const testChapter = "85184260-5a29-11ea-8b90-85dea84c548a";
const testTeacher = "0404c6f0-4663-11ea-b9a7-4753c60a4738";
// const model = require("./");
const link = require("./db");
const cache = require("./cache");

const init = async () => {
  /* 用户关系 */
  // Student是一种User

  // await link.sync({ force: true });
  await link.sync();
  console.log("Sync db ok.");
  // 创建教师
  // Teacher.createTeacher("10086", "10001", "Test Teacher").then((res) =>
  //   console.log(res.dataValues)
  // );
  // Teacher.createTeacher("aptx4869", "16041519", "zuoteng.jzt");

  // Teacher.getAll()

  // 创建学生
  // Student.createStudent("123456", "17041801", "测试学生");
  // Student.createStudent("123456", "17041802", "Test 2").then(res =>
  //   console.log(res)
  // );
  // Student.getAll({
  //   AdministrationClassId: "05fe8bd0-4fbe-11ea-b037-1555c694ae5a"
  // })
  //   .then(res => res.map(item => item.dataValues))
  //   .then(res => console.log(res));

  // Student.getCourse("5c7c4e70-5487-11ea-8972-f5283b058347").then(res =>
  //   console.log(res)
  // );
  // 登录测试
  // User.login("16041519", "aptx4869").then(res => console.log(res));
  // User.login("16041519", "123456").then(res => console.log(res));

  // User.resetPassword(testTeacher);

  // 创建学院
  // College.createCollege("计算机学院").then(res => console.log(res.dataValues));
  // 查找全部学院
  // College.getAll().then(res =>
  //   console.log(res.map(college => college.dataValues))
  // );

  // 创建专业
  // Major.createMajor("软件工程", testCollege).then(res =>
  //   console.log(res.dataValues)
  // );
  // 查找特定学院的全部专业
  // Major.getAll(testCollege)
  //   .then(res => res.map(item => item.dataValues))
  //   .then(res => console.log(res));
  // Major.getAll("testCollege")
  //   .then(res => res.map(item => item.dataValues))
  //   .then(res => console.log(res));

  // 创建行政班
  // AdministrationClass.createClass("16042225", testMajor).then(res =>
  //   console.log(res.dataValues)
  // );
  // 查找特定专业全部行政班
  // AdministrationClass.getAll(testMajor)
  // .then(res => res.map(elem => elem.dataValues))
  // .then(res => console.log(res));

  // 在教学班中添加学生
  // AdministrationClass.addStudents("7c1ab4d0-5485-11ea-aeb1-3f47908e677d", [
  //   "5c7c4e70-5487-11ea-8972-f5283b058347"
  // ]);

  // 创建学科
  // Subject.create("毛概").then(res => console.log(res.dataValues));
  // 查找全部学科
  // Subject.getAll()
  //   .then(res => res.map(elem => elem.dataValues))
  //   .then(res => console.log(res));

  // 创建章节
  // Chapter.create("一单元", testSubject).then(res =>
  //   console.log(res.dataValues)
  // );
  // 查找全部章节
  // Chapter.getAll(testSubject)
  //   .then(res => console.log(res => res.map(elem => elem.dataValues)))
  //   .then(res => console.log(res));

  // Question.create(
  //   {
  //     title: "测试单选题1",
  //     right: JSON.stringify(["A"]),
  //     type: "single",
  //     detail: {
  //       A: "aaa",
  //       B: "bbb",
  //       C: "CC"
  //     }
  //   },
  //   testChapter
  // );

  // Question.create(
  //   {
  //     title: "测试单选题2",
  //     right: JSON.stringify(["B"]),
  //     type: "single",
  //     detail: {
  //       A: "aaaaaaaa",
  //       B: "bbbbbbbb",
  //       C: "CCccccc"
  //     }
  //   },
  //   testChapter
  // );

  // Question.create(
  //   {
  //     title: "测试双选题1",
  //     right: JSON.stringify(["A", "C"]),
  //     type: "multi",
  //     detail: {
  //       A: "aaa",
  //       B: "bbbbbbbbb",
  //       C: "CC"
  //     }
  //   },
  //   testChapter
  // );

  // Question.create(
  //   {
  //     title: "测试双选题2",
  //     right: JSON.stringify(["B", "A"]),
  //     type: "multi",
  //     detail: {
  //       A: "aaaaaaaaaaaaaa",
  //       B: "bbbbbbbb",
  //       C: "CCccccc"
  //     }
  //   },
  //   testChapter
  // );

  // Question.create(
  //   {
  //     title: "测试判断题1",
  //     right: JSON.stringify(["true"]),
  //     type: "trueFalse",
  //     detail: {
  //       true: "aaaaaaaa",
  //       false: "bbbbbbbb"
  //     }
  //   },
  //   testChapter
  // );

  // Question.create(
  //   {
  //     title: "测试判断题2",
  //     right: JSON.stringify(["false"]),
  //     type: "trueFalse",
  //     detail: {
  //       true: "aaaaaaaa",
  //       false: "bbbbbbbb"
  //     }
  //   },
  //   testChapter
  // );
  // Question.getAlltestChapter, "trueFalse")
  //   .then(res => res.map(item => item.dataValues))
  //   .then(res => console.log(res));

  // const data = {
  //   name: "测试课程2",
  //   studentList: ["1"],
  //   teacher: "6ddfacd0-4fbd-11ea-933e-3962a5f03f68",
  //   subject: "6de02200-4fbd-11ea-933e-3962a5f03f68"
  // };
  // 创建课程
  // Course.create("测试课程1", "6de02200-4fbd-11ea-933e-3962a5f03f68");
  // Course.getAll("6de02200-4fbd-11ea-933e-3962a5f03f68")
  //   .then(res => res.map(item => item.dataValues))
  //   .then(res => console.log(res));
  // 将学生添加到课程
  // Course.addStudents("b63aafc0-4fd1-11ea-bed7-f551057c9598", data.studentList);
  // 将课程权限分给老师
  // Course.grantTo(testCourse, testTeacher).then(res =>
  //   console.log(res.dataValues)
  // );
  // Course.getAll("ae9d8cd0-4f20-11ea-a5f7-19dffc0cbaf8").then(res =>
  //   console.log(res)
  // );
  // Course.getExams("f46f6080-549d-11ea-b26b-a1c8bfea84be").then(res =>
  //   console.log(res)
  // );

  //创建试卷
  // Paper.createPaper("测试考卷-大考", true).then(res =>
  //   console.log(res.dataValues)
  // );
  // Paper.createPaper("测试考卷-练习", false).then(res =>
  //   console.log(res.dataValues)
  // );
  // 向试卷添加题目
  // Paper.addQuestions("ecebacf0-468e-11ea-8bbf-0fdea5f34661", {
  //   trueFalse: ["5212de10-468e-11ea-9efa-1fd0fd69a615"]
  // });

  // Paper.createPaper({
  //   name: "测试试卷1",
  //   forExam: true,
  //   singleNum: 1,
  //   singleList: [
  //     "1b8e55c0-4e29-11ea-842e-a5c2858b77fc",
  //     "1b8e7cd0-4e29-11ea-842e-a5c2858b77fc"
  //   ],
  //   multiNum: 1,
  //   multiList: [
  //     "1b8e7cd1-4e29-11ea-842e-a5c2858b77fc",
  //     "1b8ea3e0-4e29-11ea-842e-a5c2858b77fc"
  //   ],
  //   truefalseNum: 1,
  //   truefalseList: [
  //     "1b8ea3e1-4e29-11ea-842e-a5c2858b77fc",
  //     "1b8ecaf0-4e29-11ea-842e-a5c2858b77fc"
  //   ]
  // });
  // 创建考试
  // Exam.create(
  //   "测试考试",
  //   false,
  //   new Date("2020-02-28").valueOf(),
  //   60 * 1.5
  // ).then(res => console.log(res.dataValues));
  // Exam.create({
  //   name: "测试大考",
  //   type: "true",
  //   startAt: "2020-02-28 20:53:05",
  //   endAt: "2020-02-29 20:53:09",
  //   paperId: "13ff2670-4ff2-11ea-a529-8bf9159e1046",
  //   range: {
  //     students: ["975dbb10-4fc7-11ea-b14c-8bb063c7b14f"],
  //     courses: ["9cb4b440-4fd8-11ea-a2e5-9b91c4bd13c8"]
  //   }
  // });
  // 给考试分配试卷

  // 考试准备
  // Exam.prepare("af345990-5d4d-11ea-b561-0b01b59f44b1");
  // cache
  //   .hashGet("776c8630-561e-11ea-bac0-ff7f14b2e569")
  //   .then(res => console.log(res));
  // Exam.finishup(
  //   "09e1df40-5a2c-11ea-960d-b1216cdfb547",
  //   "126063c0-5a28-11ea-8880-b960ec039600",
  //   {
  //     a: "b"
  //   }
  // ).then(res => console.log(res));
  // Student.getExams(
  //   "126063c0-5a28-11ea-8880-b960ec039600",
  //   "f9d7b0d0-5a2a-11ea-8b90-85dea84c5482"
  // ).then(res => console.log(res));
  // Exam.getReview(
  //   "af345990-5d4d-11ea-b561-0b01b59f44b1",
  //   "126063c0-5a28-11ea-8880-b960ec039600"
  // ).then(res => console.log(res));
  // Exam.judge("af345990-5d4d-11ea-b561-0b01b59f44b1");
  // Exam.galance("af345990-5d4d-11ea-b561-0b01b59f44b1").then(res => {
  //   console.log(res);
  // });
  // Exam.output("af345990-5d4d-11ea-b561-0b01b59f44b1").then(res => {
  //   require("fs").writeFileSync("./test.xlsx", res);
  // });
  // Question.import("第一章.xlsx", "85184260-5a29-11ea-8b90-85dea84c548a").then(
  //   (res) => {
  //     console.log(res.slice(-5));
  //   }
  // );
  Exam.prepare("3b56d941-f02c-4217-b524-8e862e5194db");
  // Exam.judge("3c1e4a6e-df25-4e58-89ba-ba9a2e81b6bd");
};

init();

// User.resetPassword(testUser);
// User.updatePrivilege(["student", "admin"], testUser);
