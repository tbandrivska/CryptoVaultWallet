import { db } from "./db.js";

export const getAllProfiles = () => {
  return new Promise((resolve, reject) => {
    const sql = "SELECT * FROM profiles";
    db.query(sql, (err, results) => {
      if (err) return reject(err);
      resolve(results);
    });
  });
};

export const createProfile = (username, displayname, tags, addresses, bio) => {
  return new Promise((resolve, reject) => {
    const sql = "INSERT INTO profiles (username, displayname, tags, addresses, bio) VALUES (?, ?, ?, ?, ?)";
    db.query(sql, [username, displayname, tags, addresses, bio], (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
  });
};

export const getProfileByUsername = (username) => {
  return new Promise((resolve, reject) => {
    const sql = "SELECT * FROM profiles WHERE username = ?";
    db.query(sql, [username], (err, results) => {
      if (err) return reject(err);
      resolve(results[0]);
    });
  });
};