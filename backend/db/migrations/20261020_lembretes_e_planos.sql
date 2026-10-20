-- Execute no banco agendapro. Todas as alteracoes sao aditivas.
ALTER TABLE app_settings ADD COLUMN whatsapp_lembrete_minutos TEXT NULL AFTER whatsapp_tempo_lembrete_minutos;
ALTER TABLE service_plans ADD COLUMN appointment_mode VARCHAR(16) NOT NULL DEFAULT 'weekly' AFTER duration_months;
ALTER TABLE service_plans ADD COLUMN appointment_count TINYINT UNSIGNED NULL AFTER appointment_mode;
ALTER TABLE service_plan_memberships ADD COLUMN appointment_mode VARCHAR(16) NOT NULL DEFAULT 'weekly' AFTER duration_months;
ALTER TABLE service_plan_memberships ADD COLUMN appointment_count TINYINT UNSIGNED NULL AFTER appointment_mode;
