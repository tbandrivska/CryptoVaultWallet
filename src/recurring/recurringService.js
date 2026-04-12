import crypto from "crypto";
import cron from "node-cron";
import { getBalance, addTransaction } from "../transaction/transactionService.js";
import { db } from "../config/db.js";
import { getCurrentUserId } from "../routes/transactionRoutes.js";
let recurringPayments = [];

const VALID_FREQUENCIES = ["daily", "weekly", "monthly"];

const calculateNextExecution = (frequency, fromDate = new Date()) => {
  const nextDate = new Date(fromDate);

  switch (frequency) {
    case "daily":
      nextDate.setDate(nextDate.getDate() + 1);
      break;
    case "weekly":
      nextDate.setDate(nextDate.getDate() + 7);
      break;
    case "monthly":
      nextDate.setMonth(nextDate.getMonth() + 1);
      break;
    default:
      return null;
  }

  return nextDate.toISOString();
};

const logRecurringTransaction = async (walletId, type, payment, status, extra = {}) => {
  await addTransaction(walletId, {
    id: crypto.randomUUID(),
    type,
    currency: "BTC",
    amount: payment.amount,
    price: 0,
    value_gbp: 0,
    address: payment.address,
    status,
    timestamp: new Date().toISOString().slice(0, 19).replace("T", " "),
    ...extra
  });
};

export const createRecurringPayment = async ( userId, amount, address, frequency) => {
  // Find the user's BTC wallet
  const [wallets] = await db.query("SELECT id FROM wallets WHERE user_id = ? AND currency = 'BTC'", [userId]);
  if (!wallets.length) {
    return { success: false, message: "No BTC wallet found for user." };
  }
  const walletId = wallets[0].id;
  const parsedAmount = Number(amount);
  const trimmedAddress = address?.trim();
  const normalizedFrequency = frequency?.trim().toLowerCase();

  if (!trimmedAddress || trimmedAddress.length < 5) {
    return { success: false, message: "Invalid wallet address" };
  }

  if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
    return { success: false, message: "Amount must be greater than 0" };
  }

  if (!VALID_FREQUENCIES.includes(normalizedFrequency)) {
    return { success: false, message: "Invalid or missing frequency" };
  }

  // Temporary demo fix: walletId is hardcoded, so balance may come from the wrong wallet
  // const balance = await getBalance(walletId);
  // if (parsedAmount > balance) {
  //   return { success: false, message: "Insufficient funds" };
  // }

  const recurring = {
    id: crypto.randomUUID(),
    type: "recurring",
    amount: parsedAmount,
    address: trimmedAddress,
    frequency: normalizedFrequency,
    status: "active",
    createdAt: new Date().toISOString(),
    nextExecution: calculateNextExecution(normalizedFrequency)
  };

  recurringPayments.push(recurring);
  await logRecurringTransaction(walletId, "recurring-created", recurring, "scheduled");

  return { success: true, recurring };
};

export const getRecurringPayments = () => {
  return recurringPayments;
};

export const cancelRecurringPayment = (id) => {
  const payment = recurringPayments.find((p) => p.id === id);

  if (!payment) {
    return { success: false, message: "Recurring payment not found" };
  }

  if (payment.status === "cancelled") {
    return { success: false, message: "Recurring payment already cancelled" };
  }

  payment.status = "cancelled";

  return { success: true, payment };
};

cron.schedule("* * * * *", async () => {
  const walletId = 1;
  const now = new Date();

  for (const payment of recurringPayments) {
    if (payment.status !== "active") continue;

    const nextExecutionDate = new Date(payment.nextExecution);
    if (nextExecutionDate > now) continue;

    const balance = await getBalance(walletId);

    if (payment.amount <= balance) {
      await logRecurringTransaction(walletId, "recurring-execution", payment, "success");
    } else {
      await logRecurringTransaction(walletId, "recurring-execution", payment, "failed", {
        reason: "Insufficient funds"
      });
    }

    payment.nextExecution = calculateNextExecution(payment.frequency, now);
  }
});
