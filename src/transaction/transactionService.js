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
  const fakeAddresses = {
    BTC:  'bc1qxy2kgdygjrsqtzq2n0yrf249xp83kkfjhx0wlh',
    ETH:  '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
    USDT: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    SOL:  'DRpbCBMxVnDK7maPM2K65yBemM5NS2rBoNpBnry9HjDp',
    ADA:  'addr1qx2fxv2umyhttkxyxp8x0dlpdt3k6cwng5pxj3jhsydzer3n0d3vllmyqwsx5wktcd8cc3sq835lu7drv2xwl2wywfgs8a7vh',
    DOT:  '1FRMM8PEiWXYax7rpS6X4XZX1aAAxSWx1CrKTyrVYhV24fg',
    USDC: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    LTC:  'LcBV5mXEMtL6nKCHmAQoJSmU9MfKhqPqo9',
    DOGE: 'DBXu2kgc3xtvCUWFcxFE3r9hEYgmuaaCyD',
    BNB:  'bnb1grpf0955h0ykzq3ar5nmum7y6gdfl6lxfn46h2',
    LINK: '0x514910771AF9Ca656af840dff83E8264EcF986CA'
  };
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
  const normalizedAddress = address.trim().toLowerCase();

  const isFakeRecipient = Object.values(fakeAddresses)
    .map(a => a.trim().toLowerCase())
    .includes(normalizedAddress);

  if (!recipient && !isFakeRecipient) {
    return { success: false, message: "Recipient wallet not found" };
  }

  if (recipient && recipient.id === walletId) {
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

    if (recipient) {
      await addToBalance(recipient.id, amount);
    }

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

    if (recipient) {
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
    }

    await db.commit();

    return {
      success: true,
      transaction: sendTx,
      senderNewBalance: sender.balance - amount,
      recipientWalletId: recipient ? recipient.id : null,
      recipientNewBalance: recipient ? Number(recipient.balance) + Number(amount) : null
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
