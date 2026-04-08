export const findUserByUsername = (username) => {
  return new Promise((resolve, reject) => {
    const sql = "SELECT id, username FROM users WHERE username LIKE ?";

    db.query(sql, [`%${username}%`], (err, results) => {
      if (err) return reject(err);
      resolve(results);
    });
  });
};