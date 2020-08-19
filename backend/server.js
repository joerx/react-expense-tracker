const express = require("express");
const connectDB = require("./db");
const morgan = require("morgan");
const transactions = require("./routes/transactions");

require("dotenv").config();

const port = process.env.PORT || 5000;

const main = async () => {
  try {
    await connectDB();

    const app = express();
    app.use(express.json());
    app.use(morgan("dev"));
    app.use("/api/v1/transactions", transactions);

    app.use((error, req, res, next) => {
      if (error.name === "ValidationError") {
        const messages = Object.values(error.errors).map((e) => e.message);
        res.status(400).json({ messages });
      } else {
        res.status(500).json({ error });
      }
    });

    app.listen(port, () => {
      console.log(
        `Server running in ${process.env.NODE_ENV} mode on port ${port}`
      );
    });
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
};

main();
