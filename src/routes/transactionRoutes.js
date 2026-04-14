import express from "express";
import { v4 as uuidv4 } from 'uuid';
import { sendCryptoController } from "../controllers/sendCryptoController.js";
import { getTransactionHistory } from "../controllers/getTransactionHistory.js";
import { getLatestTransaction } from "../transaction/transactionService.js";
import { db } from "../config/db.js";
import {
  createRecurringController,
  getRecurringController,
  cancelRecurringController
} from "../controllers/recurringController.js";
import { fetchCoinPrice } from "../../public/coinPrices/coins.js";

const router = express.Router();

router.get("/latest", async (req, res) => {
  try {
    const { walletId } = req.query;
    if (!walletId) return res.status(400).json({ error: "Wallet ID is required" });
    const latestTx = await getLatestTransaction(walletId);
    res.json(latestTx);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error fetching latest transaction" });
  }
});

router.post("/send", sendCryptoController);

router.get("/history", getTransactionHistory);
router.get("/history/:walletId", getTransactionHistory);

router.post("/recurring", createRecurringController);
router.get("/recurring", getRecurringController);
router.delete("/recurring/:id", cancelRecurringController);

export const getCurrentUserId = (req) => req.userId;

router.post("/topup", async (req, res) => {
  const { userId, amount } = req.body;
  if (!userId || !amount || amount <= 0) {
    return res.status(400).json({ success: false, message: "Invalid input." });
  }
  try {
    let [rows] = await db.query("SELECT * FROM wallets WHERE user_id = ? AND currency = 'GBP'", [userId]);
    let walletId;
    if (rows.length === 0) {
      const [result] = await db.query(
        "INSERT INTO wallets (user_id, currency, balance) VALUES (?, 'GBP', ?)",
        [userId, amount]
      );
      walletId = result.insertId;
    } else {
      walletId = rows[0].id;
      await db.query("UPDATE wallets SET balance = balance + ? WHERE id = ?", [amount, walletId]);
    }
    const [walletRows] = await db.query("SELECT balance FROM wallets WHERE id = ?", [walletId]);
    res.json({ success: true, newBalance: walletRows[0]?.balance ?? 0 });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Top-up failed." });
  }
});

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
    // Check GBP wallet
    let [gbpRows] = await db.query(
      "SELECT * FROM wallets WHERE user_id = ? AND currency = 'GBP'",
      [userId]
    );
    if (gbpRows.length === 0 || Number(gbpRows[0].balance) < Number(amount)) {
      return res.status(400).json({ success: false, message: "Insufficient GBP balance." });
    }

    // Fetch price
    const coinId = currency.toUpperCase() === "BTC" ? "bitcoin" : "ethereum";
    const priceObj = await fetchCoinPrice(coinId);
    if (!priceObj || !priceObj.price) {
      return res.status(500).json({ success: false, message: "Could not fetch price." });
    }
    const price = priceObj.price;
    const cryptoAmount = Number(amount) / price;

    // Deduct GBP
    await db.query("UPDATE wallets SET balance = balance - ? WHERE id = ?", [amount, gbpRows[0].id]);

    // Find or create crypto wallet
    let [cryptoRows] = await db.query(
      "SELECT * FROM wallets WHERE user_id = ? AND currency = ?",
      [userId, currency]
    );
    let cryptoWalletId;

    if (cryptoRows.length === 0) {
      const address = uuidv4();
      const [insertResult] = await db.query(
        "INSERT INTO wallets (user_id, currency, balance, address) VALUES (?, ?, ?, ?)",
        [userId, currency, cryptoAmount, address]
      );
      cryptoWalletId = insertResult.insertId; // ← BUG FIX: was never assigned
    } else {
      cryptoWalletId = cryptoRows[0].id;
      await db.query(
        "UPDATE wallets SET balance = balance + ? WHERE id = ?",
        [cryptoAmount, cryptoWalletId]
      );
    }

    // Record transaction
    await db.query(
      "INSERT INTO transactions (wallet_id, type, currency, amount, price, value_gbp, address, status, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [cryptoWalletId, "buy", currency, cryptoAmount, price, amount, null, "success", new Date()]
    );

    res.json({ success: true, cryptoAmount });
  } catch (err) {
    console.error("Buy error:", err);
    res.status(500).json({ success: false, message: "Purchase failed." });
  }
});

router.post("/wallets/create", async (req, res) => {
  const { userId, currency, name } = req.body;
  if (!userId || !currency) {
    return res.status(400).json({ success: false, message: "Missing userId or currency." });
  }
  try {
    const [existing] = await db.query(
      "SELECT * FROM wallets WHERE user_id = ? AND currency = ?",
      [userId, currency]
    );
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
    await db.query("DELETE FROM transactions WHERE wallet_id = ?", [walletId]);
    await db.query("DELETE FROM wallets WHERE id = ?", [walletId]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: "Could not delete wallet." });
  }
});

router.get("/wallets/:userId/:currency/address", async (req, res) => {
  const { userId, currency } = req.params;
  try {
    const [wallets] = await db.query(
      "SELECT address FROM wallets WHERE user_id = ? AND currency = ?",
      [userId, currency]
    );
    if (!wallets.length) return res.status(404).json({ error: "Wallet not found" });
    res.json({ address: wallets[0].address });
  } catch (err) {
    res.status(500).json({ error: "Could not fetch address" });
  }
});

export default router;