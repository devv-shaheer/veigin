-- Drops every Veigin table. Used by `npm run db:down` and `npm run db:reset`.
-- Tables are dropped child-first; FK checks are disabled around the drops.

USE `veigin`;

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS `order_items`;
DROP TABLE IF EXISTS `orders`;
DROP TABLE IF EXISTS `discount_codes`;
DROP TABLE IF EXISTS `products`;
DROP TABLE IF EXISTS `drops`;
DROP TABLE IF EXISTS `categories`;
DROP TABLE IF EXISTS `settings`;

SET FOREIGN_KEY_CHECKS = 1;