CREATE TABLE IF NOT EXISTS platform_settings (
  id VARCHAR(64) NOT NULL,
  pix_key TEXT NULL,
  payment_grace_days INT NOT NULL DEFAULT 5,
  payment_alert_days INT NOT NULL DEFAULT 5,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO platform_settings (
  id,
  pix_key,
  payment_grace_days,
  payment_alert_days
) VALUES (
  'default',
  '',
  5,
  5
);

SET @has_customer_notified_paid_at := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'organization_payments'
    AND COLUMN_NAME = 'customer_notified_paid_at'
);
SET @sql := IF(
  @has_customer_notified_paid_at = 0,
  'ALTER TABLE organization_payments ADD COLUMN customer_notified_paid_at DATETIME NULL AFTER notes',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @has_customer_payment_note := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'organization_payments'
    AND COLUMN_NAME = 'customer_payment_note'
);
SET @sql := IF(
  @has_customer_payment_note = 0,
  'ALTER TABLE organization_payments ADD COLUMN customer_payment_note TEXT NULL AFTER customer_notified_paid_at',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

DROP TRIGGER IF EXISTS trg_platform_settings_updated_at;

DELIMITER $$

CREATE TRIGGER trg_platform_settings_updated_at
BEFORE UPDATE ON platform_settings
FOR EACH ROW
BEGIN
  SET NEW.updated_at = CURRENT_TIMESTAMP;
END$$

DELIMITER ;
