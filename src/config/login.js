import { db } from './db.js';

export const loginUser = (email, password) => {
  return new Promise((resolve, reject) => {
    const sql = "SELECT * FROM users WHERE email = ? AND password = ?";
    db.query(sql, [email, password], (err, results) => {
      if (err) return reject(err);
      resolve(results[0]);
    });
  });
};