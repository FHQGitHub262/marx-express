var express = require("express");
var router = express.Router();

const User = require("../models/models/User");

/* GET users listing. */
router.get("/", function (req, res, next) {
  res.send("respond with a resource");
});

// #DONE
router.post("/info", (req, res) => {
  try {
    // console.log(req.session.user);
    const success =
      Boolean(req.session.user) && Object.keys(req.session.user).length !== 0;

    res.json({
      success,
      data: req.session.user || {},
    });
  } catch (error) {
    console.log(error);
    res.json({
      success: false,
    });
  }
});

router.post("/logout", async (req, res) => {
  req.session.user = {};
  res.json({ success: true });
});

// #DONE
router.post("/login", async (req, res) => {
  // if (req.session.user) {
  //   res.json({
  //     success: true,
  //     data: req.session.user
  //   });
  // } else {
  const [success, userInfo] = await User.login(
    req.body.uuid,
    req.body.password
  );
  // console.log(userInfo);

  req.session.user = userInfo;
  res.json({ success, data: userInfo });
  // }
});

router.post("/resetPassword", async (req, res) => {
  // #TODO 去掉对应登录态
  try {
    const result = await User.resetPassword(req.body.uuid);
    console.log(result);
    res.json({
      success: true,
    });    
  } catch (error) {
    res.json({
      success: false
    })
  }

});

router.post("/set_admin", async (req, res) => {
  try {
    if (req.session.user.privilege.indexOf("admin")) {
      console.log(req.body.id);
      User.updatePrivilege(["admin"], req.body.id);
      res.json({
        success: true,
      });
    } else {
      throw new Error();
    }
  } catch (error) {
    res.json({
      success: false,
    });
  }
});

module.exports = router;
