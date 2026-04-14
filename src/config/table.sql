CREATE DATABASE IF NOT EXISTS crypto_wallet;
USE crypto_wallet;

-- --------------------------------------------------------
-- Users
-- --------------------------------------------------------
CREATE TABLE `users` (
  `id`          int(11)      NOT NULL AUTO_INCREMENT,
  `username`    varchar(50)  DEFAULT NULL,
  `email`       varchar(100) DEFAULT NULL,
  `password`    varchar(255) DEFAULT NULL,
  `phoneNumber` varchar(20)  DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `email`    (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------
-- Wallets
-- --------------------------------------------------------
CREATE TABLE `wallets` (
  `id`       int(11)         NOT NULL AUTO_INCREMENT,
  `user_id`  int(11)         DEFAULT NULL,
  `currency` varchar(10)     DEFAULT NULL,
  `balance`  decimal(18,8)   DEFAULT NULL,
  `name`     varchar(50)     DEFAULT NULL,
  `address`  varchar(255)    DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `wallets_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------
-- Transactions
-- --------------------------------------------------------
CREATE TABLE `transactions` (
  `id`        int(11)       NOT NULL AUTO_INCREMENT,
  `wallet_id` int(11)       DEFAULT NULL,
  `type`      varchar(10)   DEFAULT NULL,
  `amount`    decimal(18,8) DEFAULT NULL,
  `currency`  varchar(10)   DEFAULT NULL,
  `address`   varchar(255)  DEFAULT NULL,
  `value_gbp` decimal(18,2) DEFAULT NULL,
  `timestamp` timestamp     NOT NULL DEFAULT current_timestamp(),
  `price`     decimal(18,8) DEFAULT NULL,
  `status`    varchar(20)   DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `wallet_id` (`wallet_id`),
  CONSTRAINT `transactions_ibfk_1` FOREIGN KEY (`wallet_id`) REFERENCES `wallets` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------
-- Profiles
-- --------------------------------------------------------
CREATE TABLE `profiles` (
  `id`          int(11)      NOT NULL AUTO_INCREMENT,
  `username`    varchar(50)  DEFAULT NULL,
  `displayname` varchar(50)  DEFAULT NULL,
  `tags`        varchar(100) DEFAULT NULL,
  `addresses`   varchar(200) DEFAULT NULL,
  `bio`         varchar(500) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  CONSTRAINT `profiles_ibfk_1` FOREIGN KEY (`username`) REFERENCES `users` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;