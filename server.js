const dotenv = require("dotenv");
const mongoose = require("mongoose");
const app = require("./app");

dotenv.config({ path: "./config.env" });

// const DB = process.env.DATABASE.replace("<PASSWORD>", process.env.PASSWORD);
const DB = process.env.DATABASE;
mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false
  })
  .then(() => {
    console.log(`DB connection successful!`);
  });

const API_PORT = process.env.PORT || 3001;

const server = app.listen(API_PORT, err => {
  if (err) throw err;
  console.log(`> Ready on http://localhost:${API_PORT}`);
});

process.on("unhandledRejection", err => {
  console.log("UNHANDLED REJECTION! Shutting down...");
  console.log(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});

process.on("SIGTERM", () => {
  console.log("SIGTERM RECEIVED. Shutting down gracefully");
  server.close(() => {
    console.log("Process terminated!");
  });
});
