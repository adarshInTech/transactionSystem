const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const connection = await mongoose.connect(process.env.MONGODB_URI);
    console.log("connected to db");
  } catch (err) {
    console.error(err);
  }
};

module.exports = connectDB;
