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
    "INSERT INTO transactions (wallet_id, type, currency, amount, price, valueGBP, address, status, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
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

  const valueGBP = amount * price.price; // I changed the fethcCoinPrice function so now it works with this.

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
    "INSERT INTO transactions (wallet_id, type, currency, amount, price, valueGBP, address, status, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
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
export const receiveCrypto = async (userId, currency, amount, fromAddress) => {
  // Find or create wallet
  let [wallets] = await db.query("SELECT * FROM wallets WHERE user_id = ? AND currency = ?", [userId, currency]);
  let walletId;
  if (wallets.length === 0) {
    const [result] = await db.query("INSERT INTO wallets (user_id, currency, balance) VALUES (?, ?, ?)", [userId, currency, amount]);
    walletId = result.insertId;
  } else {
    walletId = wallets[0].id;
    await db.query("UPDATE wallets SET balance = balance + ? WHERE id = ?", [amount, walletId]);
  }
  // Record transaction
  await db.query(
    "INSERT INTO transactions (wallet_id, type, currency, amount, address, status, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?)",
    [walletId, "receive", currency, amount, fromAddress, "success", new Date()]
  );
  return { success: true, walletId };
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

// get the last transaction
export const getLatestTransaction = (walletId) => {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT * FROM transactions 
      WHERE wallet_id = ?
      ORDER BY timestamp DESC
      LIMIT 1
    `;

    db.query(sql, [walletId], (err, results) => {
      if (err) return reject(err);
      // results is an array, so we return the first (and only) item
      resolve(results.length > 0 ? results[0] : null);
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