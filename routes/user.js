var express = require("express");
var router = express.Router();

/* GET users listing. */
router.get("/", function(req, res, next) {
  res.send("respond with a resource");
});

router.post("/info", (req, res) => {
  res.json({
    success: Boolean(req.session.user),
    data: req.session.user || {}
  });
});

router.post("/login", (req, res) => {
  if (req.session.user) {
    console.log("here");

    res.json({
      success: true,
      data: req.session.user
    });
  } else {
    console.log(req.body);
    const userInfo = {
      name: "zuoteng.jzt",
      privilege: ["教师"],
      privilegeCode: 1
    };
    req.session.user = userInfo;
    res.json({ success: true, data: userInfo });
  }
});

module.exports = router;
