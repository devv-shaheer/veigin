-- Down migration for the Stage 11A admin tables only.
-- Used by `node scripts/migrate.js admin-down` (and by db:down / db:reset).
-- Tables are dropped child-first; FK checks are disabled around the drops.

USE `veigin`;

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS `stock_audit`;
DROP TABLE IF EXISTS `admin_sessions`;
DROP TABLE IF EXISTS `admin_login_attempts`;
DROP TABLE IF EXISTS `admin_users`;

SET FOREIGN_KEY_CHECKS = 1;
