var express = require("express");
var router = express.Router();

const Paper = require("../models/models/Paper");

router.get("/papers", async (req, res) => {
  console.log(req.query, req.session);
  res.json({
    success: true,
    data: await Paper.getAll().then(res => res.map(item => item.dataValues))
  });
});

router.post("/createPaper", async (req, res) => {
  console.log(req.body);

  res.json({
    success: true,
    data: await Paper.createPaper(req.body)
  });
});

module.exports = router;
