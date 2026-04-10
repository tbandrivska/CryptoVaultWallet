import { fetchCoinPrice } from "../../public/coinPrices/coins.js";
import { db } from "../config/db.js";

// Update wallet balance by subtracting amount for a given walletId
export const updateBalance = (walletId, amount) => {
  return new Promise((resolve, reject) => {
    const sql = `
      UPDATE wallets 
      SET balance = balance - ? 
      WHERE id = ?
    `;

    db.query(sql, [amount, walletId], (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
  });
};

// Add a transaction and update balance if needed
export const addTransaction = async (walletId, tx) => {
  if (
    tx.status === "success" &&
    (tx.type === "send" || tx.type === "recurring-execution")
  ) {
    await updateBalance(walletId, tx.amount);
  }
  await db.query(
    "INSERT INTO transactions (id, wallet_id, type, currency, amount, price, valueGBP, address, status, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    [
      walletId,
      tx.type,
      tx.currency,
      tx.amount,
      tx.price,
      tx.value_gbp,
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
      type: "send",
      currency,
      amount,
      price,
      value_gbp, 
      address,
      status: "success",
      timestamp: new Date().toISOString()
  };

  await db.query(
    "INSERT INTO transactions (id, wallet_id, type, currency, amount, price, valueGBP, address, status, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    [
      walletId,
      tx.type,
      tx.currency,
      tx.amount,
      tx.price,
      tx.value_gbp,
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

export const getTransactions = (walletId) => {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT * FROM transactions 
      WHERE wallet_id = ?
      ORDER BY timestamp DESC
    `;

    db.query(sql, [walletId], (err, results) => {
      if (err) return reject(err);
      resolve(results);
    });
  });
};

// Get balance for a wallet
export const getBalance = (walletId) => {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT balance FROM wallets 
      WHERE id = ?
    `;

    db.query(sql, [walletId], (err, results) => {
      if (err) return reject(err);
      resolve(results[0]?.balance ?? 0);
    });
  });
};