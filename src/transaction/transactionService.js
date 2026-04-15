import { fetchCoinPrice } from "../../public/coinPrices/coins.js";
import { db } from "../config/db.js";

// Update wallet balance by subtracting amount for a given walletId
export const updateBalance = async (walletId, amount) => {
  await db.query(
    `
      UPDATE wallets
      SET balance = balance - ?
      WHERE id = ?
    `,
    [amount, walletId]
  );
};

export const addToBalance = async (walletId, amount) => {
  await db.query(
    `
      UPDATE wallets
      SET balance = balance + ?
      WHERE id = ?
    `,
    [amount, walletId]
  );
};

export const getWalletByAddress = async (address, currency) => {
  const [rows] = await db.query(
    `
      SELECT id, balance, currency, address
      FROM wallets
      WHERE address = ? AND currency = ?
      LIMIT 1
    `,
    [address, currency]
  );

  return rows[0] ?? null;
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
    `
      INSERT INTO transactions
      (wallet_id, type, currency, amount, price, value_gbp, address, status, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
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

  if (!amount || amount <= 0) {
    return { success: false, message: "Amount must be greater than 0" };
  }

  const [senderRows] = await db.query(
    "SELECT balance, address FROM wallets WHERE id = ?",
    [walletId]
  );
  const sender = senderRows[0];

  if (!sender) {
    return { success: false, message: "Sender wallet not found" };
  }

  const recipient = await getWalletByAddress(address, currency);

  if (!recipient) {
    return { success: false, message: "Recipient wallet not found" };
  }

  if (recipient.id === walletId) {
    return { success: false, message: "Cannot send to the same wallet" };
  }

  if (amount > sender.balance) {
    return { success: false, message: "Insufficient funds" };
  }

  let coinId = currency;
  if (currency === "BTC") coinId = "bitcoin";
  else if (currency === "ETH") coinId = "ethereum";

  const priceObj = await fetchCoinPrice(coinId);

  if (!priceObj || !priceObj.price) {
    return { success: false, message: "Could not fetch price." };
  }

  const value_gbp = amount * priceObj.price;
  const timestamp = new Date().toISOString().slice(0, 19).replace("T", " ");

  try {
    await db.beginTransaction();

    await db.query(
      "UPDATE wallets SET balance = balance - ? WHERE id = ?",
      [amount, walletId]
    );

    await addToBalance(recipient.id, amount);

    const sendTx = {
      walletId,
      type: "send",
      currency,
      amount,
      price: priceObj.price,
      value_gbp,
      address,
      status: "success",
      timestamp
    };

    await db.query(
      `
        INSERT INTO transactions
        (wallet_id, type, currency, amount, price, value_gbp, address, status, timestamp)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        sendTx.walletId,
        sendTx.type,
        sendTx.currency,
        sendTx.amount,
        sendTx.price,
        sendTx.value_gbp,
        sendTx.address,
        sendTx.status,
        sendTx.timestamp
      ]
    );

    const receiveTx = {
      walletId: recipient.id,
      type: "receive",
      currency,
      amount,
      price: priceObj.price,
      value_gbp,
      address: sender.address,
      status: "success",
      timestamp
    };

    await db.query(
      `
        INSERT INTO transactions
        (wallet_id, type, currency, amount, price, value_gbp, address, status, timestamp)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        receiveTx.walletId,
        receiveTx.type,
        receiveTx.currency,
        receiveTx.amount,
        receiveTx.price,
        receiveTx.value_gbp,
        receiveTx.address,
        receiveTx.status,
        receiveTx.timestamp
      ]
    );

    await db.commit();

    return {
      success: true,
      transaction: sendTx,
      senderNewBalance: sender.balance - amount,
      recipientWalletId: recipient.id,
      recipientNewBalance: Number(recipient.balance) + Number(amount)
    };
  } catch (error) {
    await db.rollback();
    return { success: false, message: error.message || "Transaction failed" };
  }
};

export const receiveCrypto = async (userId, currency, amount, fromAddress) => {
  let [wallets] = await db.query(
    "SELECT * FROM wallets WHERE user_id = ? AND currency = ?",
    [userId, currency]
  );

  let walletId;

  if (wallets.length === 0) {
    const address = uuidv4();
    const [result] = await db.query(
  "INSERT INTO wallets (user_id, currency, balance, address) VALUES (?, ?, ?, ?)",
  [userId, currency, amount, address]
);
    walletId = result.insertId;
  } else {
    walletId = wallets[0].id;
    await db.query(
      "UPDATE wallets SET balance = balance + ? WHERE id = ?",
      [amount, walletId]
    );
  }

  await db.query(
    `
      INSERT INTO transactions
      (wallet_id, type, currency, amount, address, status, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
    [walletId, "receive", currency, amount, fromAddress, "success", new Date()]
  );

  return { success: true, walletId };
};

export const getTransactions = async (walletId) => {
  const [rows] = await db.query(
    `
      SELECT * FROM transactions
      WHERE wallet_id = ?
      ORDER BY timestamp DESC
    `,
    [walletId]
  );

  return rows;
};

export const getLatestTransaction = async (walletId) => {
  const [rows] = await db.query(
    `
      SELECT * FROM transactions
      WHERE wallet_id = ?
      ORDER BY timestamp DESC
      LIMIT 1
    `,
    [walletId]
  );

  return rows.length > 0 ? rows[0] : null;
};

export const getBalance = async (walletId) => {
  const [rows] = await db.query(
    `
      SELECT balance FROM wallets
      WHERE id = ?
    `,
    [walletId]
  );

  return rows[0]?.balance ?? 0;
};
