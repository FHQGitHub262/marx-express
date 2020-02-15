var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");

const models = require("./models/index");
const db = require("./models/db");
db.sync();
const cors = require("cors");
var logger = require("morgan");
var session = require("express-session");

const indexRouter = require("./routes/index");
const usersRouter = require("./routes/user");
const educationalRouter = require("./routes/educational");
const examinationRouter = require("./routes/examination");
const schoolRouter = require("./routes/school");

const app = express();
// app.use(
//   bodyParser.urlencoded({
//     extended: false,
//     type: "application/x-www-form-urlencoded"
//   })
// );
app.use(
  cors({
    credentials: true,
    origin: [
      // "http://192.168.0.103:3000",
      /\d{0,3}.\d{0,3}.\d{0,3}.\d{0,3}:3000/,
      /\d{0,3}.\d{0,3}.\d{0,3}.\d{0,3}:4000/
    ]
  })
);
app.set("trust proxy", 1); // trust first proxy
app.use(
  session({
    secret: "keyboard cat",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
  })
);
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));
// app.use("*", function(req, res, next) {
//   if (!req.session.user) {
//     res.redirect("/");
//     // console.log(req.path);
//   } else {
//     next();
//   }
// });
app.use("/", indexRouter);
app.use("/user", usersRouter);
app.use("/educational", educationalRouter);
app.use("/examination", examinationRouter);
app.use("/school", schoolRouter);
// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  // res.render("error");
  res.json(err);
});

module.exports = app;
