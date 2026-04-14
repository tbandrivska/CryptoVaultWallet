import { db } from "./db.js";

export const getAllProfiles = async () => {
  const [results] = await db.query("SELECT * FROM profiles");
  return results;
};

export const createProfile = async (username, displayname, tags, addresses, bio) => {
  const [result] = await db.query(
    "INSERT INTO profiles (username, displayname, tags, addresses, bio) VALUES (?, ?, ?, ?, ?)",
    [username, displayname, tags, addresses, bio]
  );
  return result;
};

export const getProfileByUsername = async (username) => {
  const [results] = await db.query(
    "SELECT * FROM profiles WHERE username = ?",
    [username]
  );
  return results[0];
};