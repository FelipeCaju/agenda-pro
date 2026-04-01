SET @has_admin_whatsapp_number := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'platform_settings'
    AND COLUMN_NAME = 'admin_whatsapp_number'
);

SET @sql := IF(
  @has_admin_whatsapp_number = 0,
  'ALTER TABLE platform_settings ADD COLUMN admin_whatsapp_number VARCHAR(32) NULL AFTER pix_key',
  'SELECT 1'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
