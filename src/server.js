import express from "express";
import db from "./config/db.js";
import app from "./app.js";

const PORT = process.env.PORT || 5000;

app.get("/", (req, res) => {
  res.send("server is Healthy");
});

const startServer = async () => {
  try {
    const connection = await db.getConnection();
    console.log("Database is connected");
    connection.release();

    app.listen(PORT, () => {
      console.log(`server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Error connecting to the database:", error);
    process.exit(1);
  }
};

startServer();

// app.listen(PORT, () => {
//    console.log(`server is running on port ${PORT}`);
// });
