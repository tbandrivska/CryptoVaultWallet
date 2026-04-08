import { getTransactions } from "../transaction/transactionService.js";

export const getTransactionHistory = async (req, res) => {
  const { walletId } = req.params;

  try {
    const transactions = await getTransactions(walletId);
    res.json(transactions);
  } catch (err) {
    res.json([]);
  }
};