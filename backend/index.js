require("dotenv").config();
const crypto = require("crypto");
const connectDB = require("./db.js");
const mainRouter = require("./routes/index.js");
const express = require("express");
const cors = require("cors");
const PORT = process.env.PORT || 3000;
const app = express();
app.use(cors());
app.use(express.json());
app.use("/api/v1", mainRouter);

app.listen(PORT, () => {
  connectDB();
  console.log(`server is listening to ${PORT}`);
});

console.log(crypto.randomBytes(32).toString("hex"));
