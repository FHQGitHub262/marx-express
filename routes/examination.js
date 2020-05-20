var express = require("express");
var router = express.Router();

const Paper = require("../models/models/Paper");

router.get("/papers", async (req, res) => {
  try {
    if (req.session.user.privilege.indexOf("admin") >= 0) {
      res.json({
        success: true,
        data: await Paper.getAll(req.query.usage).then((res) =>
          (res || []).map((item) => item.dataValues)
        ),
      });
    } else {
      res.json({
        success: true,
        data: await Paper.getAllForTeacher(
          req.session.user.uuid,
          req.query.usage
        ).then((res) => (res || []).map((item) => item.dataValues)),
      });
    }
  } catch (error) {
    console.log(error);
    res.json({
      success: false,
    });
  }
});

router.post("/createPaper", async (req, res) => {
  res.json({
    success: true,
    data: await Paper.createPaper(req.body),
  });
});

router.post("/updatePaper", async (req, res) => {
  try {
    await Paper.updatePaper(req.body);
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

router.get("/paper/detail", async (req, res) => {
  try {
    res.json({ success: true, data: await Paper.getDetail(req.query.id) });
  } catch (error) {
    res.json({ success: false });
  }
});

module.exports = router;
