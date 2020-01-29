var express = require("express");
var router = express.Router();

router.get("/colleges", (req, res) => {
  console.log(req.query, req.session);
  res.json({
    success: true,
    data: [
      {
        id: 1,
        name: "Test college",
        majorNum: 12,
        classNum: 120
      }
    ]
  });
});

router.get("/majors", (req, res) => {
  console.log(req.query, req.session);
  res.json({
    success: true,
    data: [
      {
        id: 1,
        name: "Test major",
        classNum: 120
      }
    ]
  });
});

router.get("/classes", (req, res) => {
  console.log(req.query, req.session);
  res.json({
    success: true,
    data: [
      {
        id: 1,
        name: "Test class",
        count: 45
      }
    ]
  });
});

router.get("/students", (req, res) => {
  console.log(req.query, req.session);
  res.json({
    success: true,
    data: [
      {
        id: 1,
        name: "Han Meimei"
      }
    ]
  });
});

module.exports = router;
