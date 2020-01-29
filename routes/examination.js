var express = require("express");
var router = express.Router();

router.get("/papers", (req, res) => {
  console.log(req.query, req.session);
  res.json({
    success: true,
    data: [
      {
        id: 1,
        name: "Test exams",
        subject: "Subject 1"
      }
    ]
  });
});

module.exports = router;
