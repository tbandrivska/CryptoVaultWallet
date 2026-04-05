import { sendCrypto } from "../transaction/transactionService.js";

export const sendCryptoController = (req, res) => {
  const { amount, address, currency } = req.body;

  const result = sendCrypto(Number(amount), address, currency);

  if (result.success) {
    res.json(result);
  } else {
    res.status(400).json(result);
  }
};
import { getTransactions } from "../transaction/transactionService.js";

export const getTransactionHistory = (req, res) => {
  res.json(getTransactions());
};
export const sendTransaction = (req, res) => {
  const { amount, address } = req.body;

  const result = sendCrypto(amount, address);

  res.json(result);
};