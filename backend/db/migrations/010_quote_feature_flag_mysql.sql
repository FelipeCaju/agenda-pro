SET @has_criar_orcamentos := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'app_settings'
    AND COLUMN_NAME = 'criar_orcamentos'
);

SET @sql := IF(
  @has_criar_orcamentos = 0,
  'ALTER TABLE app_settings ADD COLUMN criar_orcamentos TINYINT(1) NOT NULL DEFAULT 1 AFTER timezone',
  'SELECT 1'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
