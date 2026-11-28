-- Admin panel tables (Stage 11A). Applied by `npm run db:up` alongside schema.sql.
-- Safe to re-run: every statement is IF NOT EXISTS and existing data is kept.
-- Only adds new tables; never alters existing ones.
-- Session tokens are stored only as a sha256 hex hash (token_hash); the raw
-- token is never persisted.

-- Stock audit table for persistent inventory change history (Stage 11E)
CREATE TABLE IF NOT EXISTS `stock_audit` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `product_id` INT UNSIGNED NOT NULL,
  `admin_user_id` INT UNSIGNED NULL,
  `change_type` ENUM('adjustment','order','restock','manual','return') NOT NULL DEFAULT 'adjustment',
  `old_stock` INT NOT NULL,
  `new_stock` INT NOT NULL,
  `adjustment` INT NOT NULL,
  `reason` VARCHAR(255) NULL,
  `reference_type` ENUM('order','manual') NULL,
  `reference_id` INT UNSIGNED NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_stock_audit_product` (`product_id`),
  KEY `idx_stock_audit_admin` (`admin_user_id`),
  KEY `idx_stock_audit_created` (`created_at`),
  CONSTRAINT `fk_stock_audit_product` FOREIGN KEY (`product_id`)
    REFERENCES `products` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_stock_audit_admin` FOREIGN KEY (`admin_user_id`)
    REFERENCES `admin_users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `admin_users` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `email` VARCHAR(200) NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `last_login_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_admin_users_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `admin_sessions` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `admin_user_id` INT UNSIGNED NOT NULL,
  `token_hash` CHAR(64) NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `expires_at` DATETIME NOT NULL,
  `last_used_at` TIMESTAMP NULL DEFAULT NULL,
  `ip` VARCHAR(45) NULL,
  `user_agent` VARCHAR(255) NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_admin_sessions_token_hash` (`token_hash`),
  KEY `idx_admin_sessions_user` (`admin_user_id`),
  CONSTRAINT `fk_admin_sessions_user` FOREIGN KEY (`admin_user_id`)
    REFERENCES `admin_users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `admin_login_attempts` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `email` VARCHAR(200) NOT NULL,
  `ip` VARCHAR(45) NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_admin_login_attempts_email` (`email`),
  KEY `idx_admin_login_attempts_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
