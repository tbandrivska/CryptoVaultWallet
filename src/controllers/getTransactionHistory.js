import { getTransactions } from "../transaction/transactionService.js";

export const getTransactionHistory = async (req, res) => {
  try {
    const walletId = 1; // temporary mock wallet id for prototype
    const transactions = await getTransactions(walletId);

    return res.json({
      success: true,
      transactions
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Could not load transaction history"
    });
  }
};
