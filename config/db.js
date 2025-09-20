const mongoose = require("mongoose");
require("dotenv").config();
const mongoUri = process.env.MONGODB;

const initializeDatabase = async () => {
  await mongoose
    .connect(mongoUri, {
      serverSelectionTimeoutMS: 30000, // 30 seconds timeout
      socketTimeoutMS: 45000, // 45 seconds socket timeout
    })
    .then(() => {
      console.log("Connected to Database");
    })
    .catch((error) => console.log("Error connecting to Database", error));
};

module.exports = { initializeDatabase };