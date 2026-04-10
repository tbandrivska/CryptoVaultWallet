CREATE DATABASE crypto_wallet;
USE crypto_wallet;

CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) UNIQUE,
  email VARCHAR(100) UNIQUE,
  password VARCHAR(255)
);

CREATE TABLE wallets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  currency VARCHAR(10),
  balance DECIMAL(18,8),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE transactions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  wallet_id INT,
  type VARCHAR(10),
  amount DECIMAL(18,8),
  currency VARCHAR(10),
  address VARCHAR(255),
  value_gbp DECIMAL(18,2),
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (wallet_id) REFERENCES wallets(id)
);
ALTER TABLE transactions
  ADD COLUMN price DECIMAL(18,8),
  ADD COLUMN status VARCHAR(20);