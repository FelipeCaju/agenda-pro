-- Execute apos selecionar o banco agendapro. Todas as alteracoes sao aditivas e podem ser repetidas.
SET @schema_name = DATABASE();

SET @sql = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE app_settings ADD COLUMN whatsapp_lembrete_minutos TEXT NULL AFTER whatsapp_tempo_lembrete_minutos', 'SELECT 1') FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = @schema_name AND TABLE_NAME = 'app_settings' AND COLUMN_NAME = 'whatsapp_lembrete_minutos');
PREPARE statement FROM @sql; EXECUTE statement; DEALLOCATE PREPARE statement;

SET @sql = (SELECT IF(COUNT(*) = 0, "ALTER TABLE service_plans ADD COLUMN appointment_mode VARCHAR(16) NOT NULL DEFAULT 'weekly' AFTER duration_months", 'SELECT 1') FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = @schema_name AND TABLE_NAME = 'service_plans' AND COLUMN_NAME = 'appointment_mode');
PREPARE statement FROM @sql; EXECUTE statement; DEALLOCATE PREPARE statement;

SET @sql = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE service_plans ADD COLUMN appointment_count TINYINT UNSIGNED NULL AFTER appointment_mode', 'SELECT 1') FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = @schema_name AND TABLE_NAME = 'service_plans' AND COLUMN_NAME = 'appointment_count');
PREPARE statement FROM @sql; EXECUTE statement; DEALLOCATE PREPARE statement;

SET @sql = (SELECT IF(COUNT(*) = 0, "ALTER TABLE service_plan_memberships ADD COLUMN appointment_mode VARCHAR(16) NOT NULL DEFAULT 'weekly' AFTER duration_months", 'SELECT 1') FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = @schema_name AND TABLE_NAME = 'service_plan_memberships' AND COLUMN_NAME = 'appointment_mode');
PREPARE statement FROM @sql; EXECUTE statement; DEALLOCATE PREPARE statement;

SET @sql = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE service_plan_memberships ADD COLUMN appointment_count TINYINT UNSIGNED NULL AFTER appointment_mode', 'SELECT 1') FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = @schema_name AND TABLE_NAME = 'service_plan_memberships' AND COLUMN_NAME = 'appointment_count');
PREPARE statement FROM @sql; EXECUTE statement; DEALLOCATE PREPARE statement;
