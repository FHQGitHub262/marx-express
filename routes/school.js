var express = require("express");
var router = express.Router();

const College = require("../models/models/College");
const Major = require("../models/models/Major");
const AdministrationClass = require("../models/models/AdministrationClass");
const Student = require("../models/models/Student");

router.get("/colleges", async (req, res) => {
  const query = await College.getAll();

  res.json({
    success: true,
    data: query.map(college => college.dataValues)
  });
});

router.post("/createCollege", async (req, res) => {
  console.log(req.body);
  const query = await College.createCollege(req.body.name);
  // console.log(query);
  res.json({
    success: true,
    data: query.dataValues
  });
});

router.get("/majors", async (req, res) => {
  const data = await Major.getAll(req.query.id);
  res.json({
    success: true,
    data: data.map(major => major.dataValues)
  });
});

router.post("/createMajor", async (req, res) => {
  const query = await Major.createMajor(req.body.name, req.body.college);
  // console.log(query);
  res.json({
    success: true,
    data: query.dataValues
  });
});

router.get("/classes", async (req, res) => {
  const data = await AdministrationClass.getAll(req.query.id);
  res.json({
    success: true,
    data: data.map(classes => classes.dataValues)
  });
});

router.post("/createClass", async (req, res) => {
  console.log(req.body);
  const query = await AdministrationClass.createClass(
    req.body.name,
    req.body.major
  );
  // console.log(query);
  res.json({
    success: true,
    data: query.dataValues
  });
});

router.get("/students", async (req, res) => {
  res.json({
    success: true,
    data: await Student.getAll({ AdministrationClassId: req.query.id })
  });
});

module.exports = router;
