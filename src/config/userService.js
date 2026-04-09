import { db } from "./db.js";

export const registerUser = (username, email, password) => {
  return new Promise((resolve, reject) => {
    const sql = "INSERT INTO users (username, email, password) VALUES (?, ?, ?)";

    db.query(sql, [username, email, password], (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
  });
};