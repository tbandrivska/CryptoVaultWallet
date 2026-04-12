import { sendCrypto } from "../transaction/transactionService.js";

export const sendCryptoController = async (req, res) => {
  const { walletId, amount, address, currency } = req.body;

  try {
    const result = await sendCrypto(walletId, amount, address, currency);

    if (!result.success) {
      return res.json({ success: false, message: result.message });
    }

    res.json({ success: true, transaction: result });
  } catch (err) {
  console.error("Send transaction error:", err);
  res.json({ success: false, message: err.message || "Transaction failed" });
}
};