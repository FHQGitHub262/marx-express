var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");

const models = require("./models/index");
const tasks = require("./schedule/tasks");
const db = require("./models/db");
db.sync({
  // alter: true,
}).then(() => {
  console.log("[ORM]", "Data inited");
  models.User.createUser("admin", 10000, ["admin"], "系统管理员");
});
const cors = require("cors");
const logger = require("morgan");
const session = require("express-session");
const RedisStore = require("connect-redis")(session);
const cache = require("./models/cache").client;

const indexRouter = require("./routes/index");
const usersRouter = require("./routes/user");
const educationalRouter = require("./routes/educational");
const examinationRouter = require("./routes/examination");
const schoolRouter = require("./routes/school");
const clientRouter = require("./routes/client");

const app = express();
app.use(cors(require("./config").cors));
app.set("trust proxy", 2); // trust first proxy
app.use(
  session({
    store: new RedisStore({
      client: cache,
      prefix: "session",
    }),
    secret: "marx",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false },
  })
);
app.use(logger("dev"));

const multer = require("multer");
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    if (file.mimetype.indexOf("image") >= 0) {
      cb(null, "./public/");
    } else {
      cb(null, "./uploads/");
    }
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage: storage });

app.post("/upload", upload.single("recfile"), (req, res) => {
  console.log("req body", req.body);
  console.log("req file", req.file);
  if (req.file.fieldname) {
    res.status(200).json({ success: true, data: req.file.filename });
  } else {
    res.json({ success: false });
  }
});
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(
  express.static(path.join(__dirname, "./public"), {
    maxAge: 24 * 60 * 60 * 1000 * 7,
  })
);
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
app.use("/client", clientRouter);
// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};
  console.log(err);
  // render the error page
  res.status(err.status || 500);
  // res.render("error");
  res.json(err);
});

module.exports = app;
