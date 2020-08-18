const express = require("express");
const transactions = require("../controllers/transactions");

const router = express.Router();

router
  .route("/")
  .get(transactions.getTransactions)
  .post(transactions.addTransaction);

router.route("/:id").delete(transactions.deleteTransaction);

module.exports = router;
