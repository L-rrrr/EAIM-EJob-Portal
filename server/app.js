const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const compression = require("compression");
const path = require("path");

const createApp = () => {
  const app = express();

  const corsOptions = {
    origin: [process.env.FRONTEND_URL],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  };

  app.use("/uploads", express.static(path.join(process.cwd(), "../uploads")));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cors(corsOptions));
  app.use(cookieParser());
  app.use(express.static("./"));
  app.use(compression());

  return app;
};

module.exports = createApp;
