import { sendCrypto,
  updateBalance, 
  getTransactions 
 } from "../transaction/transactionService.js";

export const sendCryptoController = async (req, res) => {
  const { walletId, amount, address, currency } = req.body;

  try {
    // update balance
    await updateBalance(walletId, amount);

    // store transaction
    await createTransaction(walletId, {
      type: "send",
      amount,
      currency,
      address,
      valueGBP: amount * 30000 // or your API price
    });

    res.json({ success: true });

  } catch (err) {
    res.json({ success: false, message: "Transaction failed" });
  }
};