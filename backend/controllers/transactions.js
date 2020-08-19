const Transaction = require("../models/Transaction");

const mapTransaction = (t) => {
  return {
    id: t._id,
    text: t.text,
    amount: t.amount,
  };
};

/**
 * Get all transactions
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
exports.getTransactions = async (req, res, next) => {
  try {
    const transactions = await Transaction.find();
    return res
      .status(200)
      .json({ transactions: transactions.map(mapTransaction) });
  } catch (error) {
    next(error);
  }
};

exports.addTransaction = async (req, res, next) => {
  try {
    const { text, amount } = req.body;
    const transaction = await Transaction.create({ text, amount });

    return res.status(201).json({
      transaction: mapTransaction(transaction),
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteTransaction = async (req, res, next) => {
  try {
    const transaction = await Transaction.findById(req.params.id);

    if (!transaction) {
      return res.status(404).json({ error: "Transaction not found" });
    }

    await transaction.remove();

    return res.status(200).json({ transaction: mapTransaction(transaction) });
  } catch (error) {
    next(error);
  }
};
