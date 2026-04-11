import { db } from './db.js';
import { v4 as uuidv4 } from 'uuid';

export const createWallet = (userId, currency) => {
  return new Promise(async (resolve, reject) => {
    const userId = await getCurrentUserId();
    const res = await fetch('/api/transactions/wallets/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, currency, name })
    });
    // Generate a unique address (for demo, use UUID)
    const address = uuidv4();
    await db.query("INSERT INTO wallets (user_id, currency, balance, address) VALUES (?, ?, ?, ?)", [userId, currency, 0, address]);
  });
};