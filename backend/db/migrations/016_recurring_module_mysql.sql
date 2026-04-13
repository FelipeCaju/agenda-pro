USE agendapro;

SET @has_recurring_whatsapp_automatico := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'app_settings'
    AND COLUMN_NAME = 'recurring_whatsapp_automatico'
);
SET @sql := IF(
  @has_recurring_whatsapp_automatico = 0,
  'ALTER TABLE app_settings ADD COLUMN recurring_whatsapp_automatico TINYINT(1) NOT NULL DEFAULT 1 AFTER whatsapp_tempo_lembrete_minutos',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @has_recurring_marcar_vencido := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'app_settings'
    AND COLUMN_NAME = 'recurring_marcar_vencido_automaticamente'
);
SET @sql := IF(
  @has_recurring_marcar_vencido = 0,
  'ALTER TABLE app_settings ADD COLUMN recurring_marcar_vencido_automaticamente TINYINT(1) NOT NULL DEFAULT 1 AFTER recurring_whatsapp_automatico',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @has_recurring_whatsapp_template := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'app_settings'
    AND COLUMN_NAME = 'recurring_whatsapp_template'
);
SET @sql := IF(
  @has_recurring_whatsapp_template = 0,
  'ALTER TABLE app_settings ADD COLUMN recurring_whatsapp_template TEXT NULL AFTER recurring_marcar_vencido_automaticamente',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

CREATE TABLE IF NOT EXISTS recurring_profiles (
  id CHAR(36) NOT NULL,
  organization_id CHAR(36) NOT NULL,
  client_id CHAR(36) NOT NULL,
  service_id CHAR(36) NOT NULL,
  descricao VARCHAR(255) NULL,
  valor DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  data_inicio DATE NOT NULL,
  data_fim DATE NULL,
  dia_cobranca_1 TINYINT UNSIGNED NOT NULL,
  dia_cobranca_2 TINYINT UNSIGNED NULL,
  dia_cobranca_3 TINYINT UNSIGNED NULL,
  dia_cobranca_4 TINYINT UNSIGNED NULL,
  chave_pix VARCHAR(255) NULL,
  mensagem_whatsapp_personalizada TEXT NULL,
  observacoes TEXT NULL,
  ativo TINYINT(1) NOT NULL DEFAULT 1,
  created_by_user_id CHAR(36) NULL,
  updated_by_user_id CHAR(36) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_recurring_profiles_org_id (organization_id, id),
  KEY idx_recurring_profiles_org_active_dates (organization_id, ativo, data_inicio, data_fim),
  KEY idx_recurring_profiles_org_client (organization_id, client_id),
  KEY idx_recurring_profiles_org_service (organization_id, service_id),
  CONSTRAINT chk_recurring_profiles_valor CHECK (valor > 0),
  CONSTRAINT chk_recurring_profiles_dia_1 CHECK (dia_cobranca_1 BETWEEN 1 AND 31),
  CONSTRAINT chk_recurring_profiles_dia_2 CHECK (dia_cobranca_2 IS NULL OR dia_cobranca_2 BETWEEN 1 AND 31),
  CONSTRAINT chk_recurring_profiles_dia_3 CHECK (dia_cobranca_3 IS NULL OR dia_cobranca_3 BETWEEN 1 AND 31),
  CONSTRAINT chk_recurring_profiles_dia_4 CHECK (dia_cobranca_4 IS NULL OR dia_cobranca_4 BETWEEN 1 AND 31),
  CONSTRAINT chk_recurring_profiles_data_fim CHECK (data_fim IS NULL OR data_fim >= data_inicio),
  CONSTRAINT fk_recurring_profiles_organization
    FOREIGN KEY (organization_id)
    REFERENCES organizations (id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,
  CONSTRAINT fk_recurring_profiles_client_same_tenant
    FOREIGN KEY (organization_id, client_id)
    REFERENCES clients (organization_id, id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,
  CONSTRAINT fk_recurring_profiles_service_same_tenant
    FOREIGN KEY (organization_id, service_id)
    REFERENCES services (organization_id, id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,
  CONSTRAINT fk_recurring_profiles_created_by_user
    FOREIGN KEY (created_by_user_id)
    REFERENCES users (id)
    ON DELETE SET NULL
    ON UPDATE CASCADE,
  CONSTRAINT fk_recurring_profiles_updated_by_user
    FOREIGN KEY (updated_by_user_id)
    REFERENCES users (id)
    ON DELETE SET NULL
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS recurring_charges (
  id CHAR(36) NOT NULL,
  organization_id CHAR(36) NOT NULL,
  recurring_profile_id CHAR(36) NOT NULL,
  client_id CHAR(36) NOT NULL,
  client_name VARCHAR(160) NOT NULL,
  service_id CHAR(36) NOT NULL,
  service_name VARCHAR(160) NOT NULL,
  descricao VARCHAR(255) NULL,
  valor DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  referencia_competencia CHAR(7) NOT NULL,
  referencia_data_cobranca DATE NOT NULL,
  data_vencimento DATE NOT NULL,
  status ENUM('pendente', 'pago', 'vencido', 'cancelado') NOT NULL DEFAULT 'pendente',
  data_pagamento DATETIME NULL,
  forma_pagamento VARCHAR(60) NULL,
  observacoes TEXT NULL,
  chave_pix_utilizada VARCHAR(255) NULL,
  mensagem_whatsapp_utilizada TEXT NULL,
  whatsapp_enviado TINYINT(1) NOT NULL DEFAULT 0,
  whatsapp_status VARCHAR(30) NULL,
  whatsapp_tentativas INT UNSIGNED NOT NULL DEFAULT 0,
  whatsapp_ultimo_envio_em DATETIME NULL,
  whatsapp_ultimo_erro TEXT NULL,
  criado_automaticamente TINYINT(1) NOT NULL DEFAULT 1,
  created_by_user_id CHAR(36) NULL,
  updated_by_user_id CHAR(36) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_recurring_charges_org_id (organization_id, id),
  UNIQUE KEY uq_recurring_charges_org_profile_reference (
    organization_id,
    recurring_profile_id,
    referencia_data_cobranca
  ),
  KEY idx_recurring_charges_org_status_due (organization_id, status, data_vencimento),
  KEY idx_recurring_charges_org_profile (organization_id, recurring_profile_id),
  KEY idx_recurring_charges_org_client (organization_id, client_id),
  KEY idx_recurring_charges_org_service (organization_id, service_id),
  KEY idx_recurring_charges_org_competencia (organization_id, referencia_competencia),
  KEY idx_recurring_charges_org_whatsapp (organization_id, whatsapp_enviado, whatsapp_ultimo_envio_em),
  CONSTRAINT chk_recurring_charges_valor CHECK (valor > 0),
  CONSTRAINT chk_recurring_charges_competencia CHECK (referencia_competencia REGEXP '^[0-9]{4}-[0-9]{2}$'),
  CONSTRAINT fk_recurring_charges_organization
    FOREIGN KEY (organization_id)
    REFERENCES organizations (id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,
  CONSTRAINT fk_recurring_charges_profile_same_tenant
    FOREIGN KEY (organization_id, recurring_profile_id)
    REFERENCES recurring_profiles (organization_id, id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,
  CONSTRAINT fk_recurring_charges_client_same_tenant
    FOREIGN KEY (organization_id, client_id)
    REFERENCES clients (organization_id, id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,
  CONSTRAINT fk_recurring_charges_service_same_tenant
    FOREIGN KEY (organization_id, service_id)
    REFERENCES services (organization_id, id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,
  CONSTRAINT fk_recurring_charges_created_by_user
    FOREIGN KEY (created_by_user_id)
    REFERENCES users (id)
    ON DELETE SET NULL
    ON UPDATE CASCADE,
  CONSTRAINT fk_recurring_charges_updated_by_user
    FOREIGN KEY (updated_by_user_id)
    REFERENCES users (id)
    ON DELETE SET NULL
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS recurring_logs (
  id CHAR(36) NOT NULL,
  organization_id CHAR(36) NOT NULL,
  recurring_profile_id CHAR(36) NULL,
  recurring_charge_id CHAR(36) NULL,
  tipo_evento VARCHAR(50) NOT NULL,
  descricao TEXT NULL,
  payload_json LONGTEXT NULL,
  created_by_user_id CHAR(36) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_recurring_logs_org_created_at (organization_id, created_at),
  KEY idx_recurring_logs_org_event_type (organization_id, tipo_evento),
  KEY idx_recurring_logs_org_profile (organization_id, recurring_profile_id),
  KEY idx_recurring_logs_org_charge (organization_id, recurring_charge_id),
  CONSTRAINT fk_recurring_logs_organization
    FOREIGN KEY (organization_id)
    REFERENCES organizations (id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,
  CONSTRAINT fk_recurring_logs_profile_same_tenant
    FOREIGN KEY (organization_id, recurring_profile_id)
    REFERENCES recurring_profiles (organization_id, id)
    ON DELETE SET NULL
    ON UPDATE CASCADE,
  CONSTRAINT fk_recurring_logs_charge_same_tenant
    FOREIGN KEY (organization_id, recurring_charge_id)
    REFERENCES recurring_charges (organization_id, id)
    ON DELETE SET NULL
    ON UPDATE CASCADE,
  CONSTRAINT fk_recurring_logs_created_by_user
    FOREIGN KEY (created_by_user_id)
    REFERENCES users (id)
    ON DELETE SET NULL
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DELIMITER $$

DROP TRIGGER IF EXISTS trg_recurring_profiles_updated_at$$
CREATE TRIGGER trg_recurring_profiles_updated_at
BEFORE UPDATE ON recurring_profiles
FOR EACH ROW
BEGIN
  SET NEW.updated_at = CURRENT_TIMESTAMP;
END$$

DROP TRIGGER IF EXISTS trg_recurring_charges_updated_at$$
CREATE TRIGGER trg_recurring_charges_updated_at
BEFORE UPDATE ON recurring_charges
FOR EACH ROW
BEGIN
  SET NEW.updated_at = CURRENT_TIMESTAMP;
END$$

DELIMITER ;
