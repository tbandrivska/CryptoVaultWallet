import express from "express";
import { sendCryptoController } from "../controllers/sendCryptoController.js";
import { getTransactionHistory } from "../controllers/getTransactionHistory.js";
import { getLatestTransaction } from "../transaction/transactionService.js";
import { db } from "../config/db.js";
import {
  createRecurringController,
  getRecurringController,
  cancelRecurringController
} from "../controllers/recurringController.js";

const router = express.Router();

router.get("/latest", async (req, res) => {
    try {
        const { walletId } = req.query; // Or get it from a session/auth
        if (!walletId) {
            return res.status(400).json({ error: "Wallet ID is required" });
        }

        const latestTx = await getLatestTransaction(walletId);
        res.json(latestTx);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server error fetching latest transaction" });
    }
});

router.post("/send", sendCryptoController);

router.get("/history", getTransactionHistory);

router.post("/recurring", createRecurringController);

router.get("/recurring", getRecurringController);
router.get("/history/:walletId", getTransactionHistory);
router.delete("/recurring/:id", cancelRecurringController);
export const getCurrentUserId = (req) => {
  return req.userId; 
};
router.post("/topup", async (req, res) => {
  const { userId, amount } = req.body; //get userId from body
  if (!userId || !amount || amount <= 0) {
    return res.status(400).json({ success: false, message: "Invalid input." });
  }
  try {
    // Find or create GBP wallet
    let [rows] = await db.query("SELECT * FROM wallets WHERE user_id = ? AND currency = 'GBP'", [userId]);
    let walletId;
    if (rows.length === 0) {
      const result = await db.query("INSERT INTO wallets (user_id, currency, balance) VALUES (?, 'GBP', ?)", [userId, amount]);
      walletId = result[0].insertId;
    } else {
      walletId = rows[0].id;
      await db.query("UPDATE wallets SET balance = balance + ? WHERE id = ?", [amount, walletId]);
    }
    // Get new balance
    const [walletRows] = await db.query("SELECT balance FROM wallets WHERE id = ?", [walletId]);
    res.json({ success: true, newBalance: walletRows[0]?.balance ?? 0 });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Top-up failed." });
  }
});
import { fetchCoinPrice } from "../../public/coinPrices/coins.js"; 
router.get("/wallets/:userId", async (req, res) => {
  const { userId } = req.params;
  try {
    const [wallets] = await db.query("SELECT * FROM wallets WHERE user_id = ?", [userId]);
    res.json(wallets);
  } catch (err) {
    res.status(500).json({ success: false, message: "Could not fetch wallets." });
  }
});
router.post("/buy", async (req, res) => {
  const { userId, currency, amount } = req.body;
  if (!userId || !currency || !amount || amount <= 0) {
    return res.status(400).json({ success: false, message: "Invalid input." });
  }
  try {
    // Find GBP wallet
    let [gbpRows] = await db.query("SELECT * FROM wallets WHERE user_id = ? AND currency = 'GBP'", [userId]);
    if (gbpRows.length === 0 || gbpRows[0].balance < amount) {
      return res.status(400).json({ success: false, message: "Insufficient GBP balance." });
    }
    // Get current price in GBP
    const priceObj = await fetchCoinPrice(currency.toLowerCase() === "btc" ? "bitcoin" : "ethereum");
    if (!priceObj || !priceObj.price) {
      return res.status(500).json({ success: false, message: "Could not fetch price." });
    }
    const price = priceObj.price;
    const cryptoAmount = amount / price;

    // Deduct GBP
    await db.query("UPDATE wallets SET balance = balance - ? WHERE id = ?", [amount, gbpRows[0].id]);

    // Find or create crypto wallet
    let [cryptoRows] = await db.query("SELECT * FROM wallets WHERE user_id = ? AND currency = ?", [userId, currency]);
    let cryptoWalletId;
    if (cryptoRows.length === 0) {
      const result = await db.query("INSERT INTO wallets (user_id, currency, balance) VALUES (?, ?, ?)", [userId, currency, cryptoAmount]);
      cryptoWalletId = result[0].insertId;
    } else {
      cryptoWalletId = cryptoRows[0].id;
      await db.query("UPDATE wallets SET balance = balance + ? WHERE id = ?", [cryptoAmount, cryptoWalletId]);
    }

    // Record transaction
    await db.query(
      "INSERT INTO transactions (wallet_id, type, currency, amount, price, value_gbp, address, status, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [
        cryptoWalletId,
        "buy",
        currency,
        cryptoAmount,
        price,
        amount,
        null,
        "success",
        new Date()
      ]
    );

    res.json({ success: true, cryptoAmount });
  } catch (err) {
    res.status(500).json({ success: false, message: "Purchase failed." });
  }
});
import { v4 as uuidv4 } from 'uuid';

router.post("/wallets/create", async (req, res) => {
  const { userId, currency, name } = req.body;
  if (!userId || !currency) {
    return res.status(400).json({ success: false, message: "Missing userId or currency." });
  }
  try {
    // Prevent duplicate wallet for same currency
    const [existing] = await db.query("SELECT * FROM wallets WHERE user_id = ? AND currency = ?", [userId, currency]);
    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: "Wallet for this currency already exists." });
    }
    const address = uuidv4();
    const [result] = await db.query(
      "INSERT INTO wallets (user_id, currency, balance, name, address) VALUES (?, ?, 0, ?, ?)",
      [userId, currency, name || null, address]
    );
    res.json({ success: true, walletId: result.insertId });
  } catch (err) {
    res.status(500).json({ success: false, message: "Could not create wallet." });
  }
});
router.put("/wallets/:walletId/rename", async (req, res) => {
  const { walletId } = req.params;
  const { name } = req.body;
  if (!name) return res.status(400).json({ success: false, message: "Name required." });
  try {
    await db.query("UPDATE wallets SET name = ? WHERE id = ?", [name, walletId]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: "Could not rename wallet." });
  }
});
router.delete("/wallets/:walletId", async (req, res) => {
  const { walletId } = req.params;
  try {
    // Delete all transactions for this wallet first
    await db.query("DELETE FROM transactions WHERE wallet_id = ?", [walletId]);
    // Now delete the wallet
    await db.query("DELETE FROM wallets WHERE id = ?", [walletId]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: "Could not delete wallet." });
  }
});
export default router;
//router.post("/send", sendTransaction);
