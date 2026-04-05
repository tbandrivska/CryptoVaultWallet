import crypto from "crypto";
import { fetchCoinPrice } from "coinPrices/coins.js";
let balance = 500;
let transactions = [];

export const updateBalance = (amount) => {
  balance -= amount;
};

export const addTransaction = (tx) => {
  if (
    tx.status === "success" &&
    (tx.type === "send" || tx.type === "recurring-execution")
  ) {
    balance -= tx.amount;
  }

  transactions.push(tx);
};

export const sendCrypto = (amount, address, currency = "BTC") => {
  if (!address || address.length < 5) {
    return { success: false, message: "Invalid wallet address" };
  }

  if (amount <= 0) {
    return { success: false, message: "Amount must be greater than 0" };
  }

  if (amount > balance) {
    return { success: false, message: "Insufficient funds" };
  }

  const price = fetchCoinPrice(currency);

  const valueGBP = amount * price;

  balance -= amount;

  const tx = {
    id: "0x" + Math.random().toString(16).substring(2, 10),
    type: "send",
    currency,
    amount,
    price,
    valueGBP,
    address,
    status: "success",
    timestamp: new Date().toLocaleString()
  };

  transactions.push(tx);

  return {
    success: true,
    ...tx,
    newBalance: balance
  };
};
export const getTransactions = () => {
  return transactions;
};

export const getBalance = () => balance;
