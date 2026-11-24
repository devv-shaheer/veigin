-- Veigin schema (MySQL / MariaDB on XAMPP).
-- Import this file directly in phpMyAdmin, or run `npm run db:up`.
-- Safe to re-run: every statement is IF NOT EXISTS and existing data is kept.
-- All money values are integer PKR. Scatter values are the fixed home layout.

CREATE DATABASE IF NOT EXISTS `veigin`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `veigin`;

CREATE TABLE IF NOT EXISTS `settings` (
  `setting_key` VARCHAR(64) NOT NULL,
  `setting_value` VARCHAR(255) NOT NULL,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`setting_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `categories` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(120) NOT NULL,
  `slug` VARCHAR(120) NOT NULL,
  `sort_order` INT NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_categories_slug` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `drops` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(160) NOT NULL,
  `slug` VARCHAR(160) NOT NULL,
  `description` TEXT NULL,
  `status` ENUM('upcoming','scheduled','active','ended','archived') NOT NULL DEFAULT 'upcoming',
  `release_at` DATETIME NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_drops_slug` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `products` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(200) NOT NULL,
  `slug` VARCHAR(200) NOT NULL,
  `description` TEXT NULL,
  `price` INT NOT NULL,
  `compare_at_price` INT NULL,
  `category_id` INT UNSIGNED NULL,
  `drop_id` INT UNSIGNED NULL,
  `stock` INT NOT NULL DEFAULT 0,
  `availability` ENUM('available','sold_out','exclusive','archived') NOT NULL DEFAULT 'available',
  `restockable` BOOLEAN NOT NULL DEFAULT FALSE,
  `is_best_seller` BOOLEAN NOT NULL DEFAULT FALSE,
  `is_new_drop` BOOLEAN NOT NULL DEFAULT FALSE,
  `is_exclusive` BOOLEAN NOT NULL DEFAULT FALSE,
  `material` VARCHAR(255) NULL,
  `length_label` VARCHAR(120) NULL,
  `build_details` TEXT NULL,
  `media` JSON NULL,
  `scatter_x` DECIMAL(5,2) NOT NULL DEFAULT 50.00,
  `scatter_y` DECIMAL(5,2) NOT NULL DEFAULT 50.00,
  `rotation` DECIMAL(4,2) NOT NULL DEFAULT 0.00,
  `show_on_home` BOOLEAN NOT NULL DEFAULT FALSE,
  `home_x` DECIMAL(5,2) NOT NULL DEFAULT 50.00,
  `home_y` DECIMAL(5,2) NOT NULL DEFAULT 50.00,
  `home_rot` DECIMAL(4,2) NOT NULL DEFAULT 0.00,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_products_slug` (`slug`),
  KEY `idx_products_category` (`category_id`),
  KEY `idx_products_drop` (`drop_id`),
  CONSTRAINT `fk_products_category` FOREIGN KEY (`category_id`)
    REFERENCES `categories` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_products_drop` FOREIGN KEY (`drop_id`)
    REFERENCES `drops` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `discount_codes` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `code` VARCHAR(64) NOT NULL,
  `type` ENUM('percentage','fixed') NOT NULL,
  `value` INT NOT NULL,
  `min_subtotal` INT NOT NULL DEFAULT 0,
  `expires_at` DATETIME NULL,
  `usage_limit` INT NULL,
  `used_count` INT NOT NULL DEFAULT 0,
  `active` BOOLEAN NOT NULL DEFAULT TRUE,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_discount_codes_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `orders` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `order_number` VARCHAR(32) NOT NULL,
  `customer_name` VARCHAR(200) NOT NULL,
  `phone` VARCHAR(40) NOT NULL,
  `email` VARCHAR(200) NOT NULL,
  `address` TEXT NOT NULL,
  `city` VARCHAR(120) NOT NULL,
  `subtotal` INT NOT NULL,
  `auto_discount` INT NOT NULL DEFAULT 0,
  `discount_code_id` INT UNSIGNED NULL,
  `discount_code_amount` INT NOT NULL DEFAULT 0,
  `delivery_fee` INT NOT NULL DEFAULT 0,
  `total` INT NOT NULL,
  `payment_method` ENUM('cod','easypaisa') NOT NULL,
  `payment_status` ENUM('awaiting_payment','paid','rejected','refunded') NOT NULL DEFAULT 'awaiting_payment',
  `order_status` ENUM('placed','processing','dispatched','in_transit','delivered','cancellation_requested','cancelled','replacement_requested','refunded') NOT NULL DEFAULT 'placed',
  `easypaisa_txn_id` VARCHAR(120) NULL,
  `payment_proof_url` VARCHAR(500) NULL,
  `payment_hold_until` DATETIME NULL,
  `tracking_id` VARCHAR(120) NULL,
  `rejection_reason` VARCHAR(255) NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_orders_number` (`order_number`),
  KEY `idx_orders_email` (`email`),
  KEY `idx_orders_phone` (`phone`),
  CONSTRAINT `fk_orders_discount_code` FOREIGN KEY (`discount_code_id`)
    REFERENCES `discount_codes` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `order_items` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `order_id` INT UNSIGNED NOT NULL,
  `product_id` INT UNSIGNED NULL,
  `product_name` VARCHAR(200) NOT NULL,
  `unit_price` INT NOT NULL,
  `quantity` INT NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_order_items_order` (`order_id`),
  KEY `idx_order_items_product` (`product_id`),
  CONSTRAINT `fk_order_items_order` FOREIGN KEY (`order_id`)
    REFERENCES `orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_order_items_product` FOREIGN KEY (`product_id`)
    REFERENCES `products` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;