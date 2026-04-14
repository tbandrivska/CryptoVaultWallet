import { db } from './db.js';

export const findUserByUsername = async (username) => {
  const [results] = await db.query(
    "SELECT id, username FROM users WHERE username LIKE ?",
    [`%${username}%`]
  );
  return results;
};