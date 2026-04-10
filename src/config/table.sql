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
  price DECIMAL(18,8),
  status VARCHAR(20),
  FOREIGN KEY (wallet_id) REFERENCES wallets(id)
);

  
CREATE TABLE profiles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) UNIQUE, 
  displayname VARCHAR(50), 
  tags VARCHAR(100),
  addresses VARCHAR(200),
  bio VARCHAR(500),
  FOREIGN KEY (username) REFERENCES users(username)
)ALTER TABLE wallets ADD COLUMN name VARCHAR(50) DEFAULT NULL;