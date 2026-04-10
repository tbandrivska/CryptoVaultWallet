import { db } from './db.js';

export const loginUser = async (email, password) => {
  const sql = "SELECT * FROM users WHERE email = ? AND password = ?";
  const [results] = await db.query(sql, [email, password]);
  return results[0];
};