var config = {
  dialect: "mysql",
  database: "marx",
  username: "root",
  password: "Ssq03230202",
  // password: "temppassword",
  host: "129.204.218.96:3306",
  // host: "172.31.25.39:3306",
  port: 3306,
  http: 4000,
  redis: { host: "129.204.218.96", port: "6380", password: "aptx4869" },
  // redis: { host: "129.204.218.96", port: "6379", password: "zjsrumarx." },
  cors: {
    credentials: true,
    exposedHeaders: ["Content-Disposition"],
    origin: [
      // "http://192.168.0.103:3000",
      "localhost:8080",
      /\d{0,3}.\d{0,3}.\d{0,3}.\d{0,3}:3000/,
      /\d{0,3}.\d{0,3}.\d{0,3}.\d{0,3}:5000/,
      /\d{0,3}.\d{0,3}.\d{0,3}.\d{0,3}:5001/,
      /\d{0,3}.\d{0,3}.\d{0,3}.\d{0,3}:4000/,
      /\d{0,3}.\d{0,3}.\d{0,3}.\d{0,3}:8080/,
    ],
  },
  redisTick: 10,
};

module.exports = config;
