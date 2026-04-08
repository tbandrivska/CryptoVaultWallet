export const createWallet = (userId, currency) => {
  return new Promise((resolve, reject) => {
    const sql = "INSERT INTO wallets (user_id, currency, balance) VALUES (?, ?, ?)";

    db.query(sql, [userId, currency, 0], (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
  });
};