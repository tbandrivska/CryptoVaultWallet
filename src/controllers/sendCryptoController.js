import { sendCrypto } from "../transaction/transactionService.js";

export const sendCryptoController = async (req, res) => {
  const { amount, address, currency } = req.body;

  try {
    const walletId = 1; // temporary mock wallet id for prototype
    const result = await sendCrypto(walletId, Number(amount), address, currency);

    if (result.success) {
      return res.json(result);
    } else {
      return res.status(400).json(result);
    }
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};
