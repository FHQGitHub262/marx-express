const sequelize = require("../db");
const Sequelize = require("sequelize");
const User = require("./User");
const Course = require("./Course");
const College = require("./College");
const Subject = require("./Subject");
const Major = require("./Major");
const AdministrationClass = require("./AdministrationClass");

const xlsx = require("node-xlsx").default;
const path = require("path");
const Util = require(path.resolve(__dirname, "../util"));

class Student extends Sequelize.Model { }
Student.init(
  {
    name: Sequelize.STRING(100),
    idNumber: { type: Sequelize.STRING(100), unique: true, primaryKey: true },
  },
  { sequelize, modelName: "Student" }
);

exports.createStudent = async (password, idNumber, name) => {
  const user = await
    User.createUser(password, idNumber, ["student"], name)
  const student = await
    Student.findOrCreate({
      where: {
        idNumber
      }, defaults: {
        name,
        idNumber,
        UserUuid: user.uuid
      }
    })

  console.log("gere", user.dataValues, student);
  return user.dataValues
};

exports.getAll = async (config = {}) => {
  return await Student.findAll({ where: config });
};

exports.getCourse = async (studentId) => {
  const theStudent = await Student.findOne({
    where: { UserUuid: studentId },
  });
  if (theStudent) {
    return await Promise.all(
      (
        await theStudent.getCourses({
          where: { status: "active" },
        })
      ).map(async (item) => ({
        ...item.dataValues,
        pic: (
          await Subject.model.findOne({
            where: {
              id: item.dataValues.SubjectId,
            },
            attributes: ["pic"],
          })
        ).dataValues.pic,
      }))
    );
  } else return [];
};

exports.getExams = async (studentId, courseId) => {
  const theStudent = await Student.findOne({
    where: {
      UserUuid: studentId,
    },
  });
  return await theStudent.getExams({
    through: {
      where: {
        ExamId: {
          [Sequelize.Op.in]: (await Course.getExams(courseId)).map(
            (item) => item.dataValues.id
          ),
        },
      },
    },
  });
};

exports.import = async (fileName, collegeId) => {
  const file = xlsx.parse(path.resolve(__dirname, "../../uploads", fileName));
  const classTable = {};
  const belongsTable = {};
  const studentPrivi = JSON.stringify(["student"]);
  const raw = file.reduce((prev, current) => {
    console.log(current.data);
    const data = (current.data || []).filter(item => item.length && item.length > 0).reduce((prev, item, index) => {
      if (index === 0) return prev;
      const [collegeName, majorName, className, name, idNumber] = item;
      const id = Util.uuid();
      if (!classTable[majorName]) {
        classTable[majorName] = [];
      }

      if (classTable[majorName].indexOf(className) < 0) {
        classTable[majorName].push(className);
      }
      if (!belongsTable[className]) {
        belongsTable[className] = [];
      }

      belongsTable[className].push(idNumber);

      return [
        ...prev,
        {
          uuid: id,
          name,
          idnumber: Number(idNumber),
          passwd: "123456",
          privilege: studentPrivi,
        },
      ];
    }, []);
    // console.log(data);
    return [...prev, ...data];
  }, []);
  // console.log(1, raw.splice(20));
  const theUsers = await User.model.bulkCreate(raw, {
    updateOnDuplicate: ["idnumber"],
  });
  console.log(2);
  const rawStudent = raw.reduce((prev, item) => {
    return {
      ...prev,
      [item.uuid]: {
        name: item.name,
        idNumber: String(item.idnumber),
      },
    };
  }, {});
  console.log(3);
  const studentMerge = theUsers.map((user) => ({
    UserUuid: user.dataValues.uuid,
    ...rawStudent[user.dataValues.uuid],
  }));
  console.log(4);
  await Student.bulkCreate(studentMerge, { updateOnDuplicate: ["name"] });
  console.log(5);
  const targetCollege = await College.model.findOne({
    where: { id: collegeId },
  });
  console.log(6);
  // 创建所需的专业、班级
  const majorNames = Object.keys(classTable);
  for (let i = 0; i < majorNames.length; i++) {
    const majorName = majorNames[i];
    const classes = classTable[majorName];

    const targetMajor = await targetCollege.getMajors({
      where: { name: majorName },
    });

    let theMajor;
    if (targetMajor.length === 0) {
      theMajor = await Major.createMajor(majorName, collegeId);
    } else {
      theMajor = targetMajor[0];
    }

    for (let i = 0; i < classes.length; i++) {
      const className = classes[i];

      const targetClass = await theMajor.getAdministrationClasses({
        where: { name: className },
      });

      if (targetClass.length === 0) {
        await AdministrationClass.createClass(className, theMajor.dataValues.id);
      }
    }
  }
  console.log(7);
  // 关联班级和学生
  for (let i = 0; i < Object.keys(belongsTable).length; i++) {
    let className = Object.keys(belongsTable)[i];
    let studentList = belongsTable[className];
    console.log(className, studentList, i);
    let [theClass, theStudents] = await Promise.all([
      AdministrationClass.model.findOne({
        where: { name: className },
      }),
      Student.findAll({
        where: { idnumber: { [Sequelize.Op.in]: studentList } },
      }),
    ]);
    await theClass.addStudents(theStudents);
  }

  return;
  // await targetChapter.addQuestions(questions);
};

exports.model = Student;
