const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const { Account } = require("../models/users.js");
const { authMiddleware } = require("../middleware/middleware.js");

router.get("/balance", authMiddleware, async (req, res) => {
  const account = await Account.findOne({
    userId: req.userId,
  });
  res.json({
    balance: account.balance,
  });
});

router.post("/transfer", authMiddleware, async (req, res) => {
  const session = await mongoose.startSession();

  session.startTransaction();

  const { amount, to } = req.body;

  // fetch the accounts with the transaction

  const account = await Account.findOne({ userId: req.userId }).session(
    session,
  );

  if (!account || account.balance < amount) {
    await session.abortTransaction();
    return res.status(400).json({
      message: "insufficient balance",
    });
  }

  const toAccount = await Account.findOne({ userId: to }).session(session);

  if (!toAccount) {
    await session.abortTransaction();
    return res.status(400).json({
      message: "invalid account",
    });
  }

  // perform the transfer

  await Account.updateOne(
    { userId: req.userId },
    { $inc: { balance: -amount } },
  ).session(session);
  await Account.updateOne(
    { userId: to },
    { $inc: { balance: amount } },
  ).session(session);

  // commit the transaction
  await session.commitTransaction();

  res.json({
    message: "transaction successfull",
  });
});
module.exports = router;
