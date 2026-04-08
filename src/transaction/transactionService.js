import { fetchCoinPrice } from "../coinPrices/coins.js";
import { db } from "../config/db.js";

// Update wallet balance by subtracting amount for a given walletId
export const updateBalance = async (walletId, amount) => {
  await db.query("UPDATE wallets SET balance = balance - ? WHERE id = ?", [amount, walletId]);
};

// Add a transaction and update balance if needed
export const addTransaction = async (walletId, tx) => {
  if (
    tx.status === "success" &&
    (tx.type === "send" || tx.type === "recurring-execution")
  ) {
    await db.query("UPDATE wallets SET balance = balance - ? WHERE id = ?", [tx.amount, walletId]);
  }
  await db.query(
    "INSERT INTO transactions (id, wallet_id, type, currency, amount, price, valueGBP, address, status, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    [
      tx.id,
      walletId,
      tx.type,
      tx.currency,
      tx.amount,
      tx.price,
      tx.valueGBP,
      tx.address,
      tx.status,
      tx.timestamp
    ]
  );
};

// Send crypto, update balance, and record transaction
export const sendCrypto = async (walletId, amount, address, currency = "BTC") => {
  if (!address || address.length < 5) {
    return { success: false, message: "Invalid wallet address" };
  }

  if (amount <= 0) {
    return { success: false, message: "Amount must be greater than 0" };
  }

  const [rows] = await db.query("SELECT balance FROM wallets WHERE id = ?", [walletId]);
  const balance = rows[0]?.balance ?? 0;

  if (amount > balance) {
    return { success: false, message: "Insufficient funds" };
  }

  const price = await fetchCoinPrice(currency);

  const valueGBP = amount * price;

  await db.query("UPDATE wallets SET balance = balance - ? WHERE id = ?", [amount, walletId]);

  const tx = {
    id: "0x" + Math.random().toString(16).substring(2, 10),
    type: "send",
    currency,
    amount,
    price,
    valueGBP,
    address,
    status: "success",
    timestamp: new Date().toISOString()
  };

  await db.query(
    "INSERT INTO transactions (id, wallet_id, type, currency, amount, price, valueGBP, address, status, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    [
      tx.id,
      walletId,
      tx.type,
      tx.currency,
      tx.amount,
      tx.price,
      tx.valueGBP,
      tx.address,
      tx.status,
      tx.timestamp
    ]
  );

  return {
    success: true,
    ...tx,
    newBalance: balance - amount
  };
};

// Get all transactions for a wallet
export const getTransactions = async (walletId) => {
  const [rows] = await db.query("SELECT * FROM transactions WHERE wallet_id = ? ORDER BY timestamp DESC", [walletId]);
  return rows;
};

// Get balance for a wallet
export const getBalance = async (walletId) => {
  const [rows] = await db.query("SELECT balance FROM wallets WHERE id = ?", [walletId]);
  return rows[0]?.balance ?? 0;
};
