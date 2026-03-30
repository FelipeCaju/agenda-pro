CREATE DATABASE IF NOT EXISTS agendapro
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE agendapro;

CREATE TABLE IF NOT EXISTS organizations (
  id CHAR(36) NOT NULL,
  nome_empresa VARCHAR(160) NOT NULL,
  email_responsavel VARCHAR(160) NOT NULL,
  telefone VARCHAR(30) NULL,
  monthly_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  subscription_status ENUM('active', 'overdue', 'blocked', 'trial', 'canceled') NOT NULL DEFAULT 'trial',
  subscription_plan VARCHAR(50) NOT NULL DEFAULT 'starter',
  due_date DATE NULL,
  trial_end DATE NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_organizations_subscription_status (subscription_status),
  KEY idx_organizations_due_date (due_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS users (
  id CHAR(36) NOT NULL,
  organization_id CHAR(36) NOT NULL,
  nome VARCHAR(160) NOT NULL,
  email VARCHAR(160) NOT NULL,
  google_id VARCHAR(190) NULL,
  apple_id VARCHAR(190) NULL,
  auth_provider ENUM('email', 'google', 'apple') NOT NULL DEFAULT 'email',
  password_hash VARCHAR(255) NULL,
  role ENUM('owner', 'admin', 'manager', 'staff', 'viewer') NOT NULL DEFAULT 'admin',
  ativo TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_organization_email (organization_id, email),
  UNIQUE KEY uq_users_organization_google_id (organization_id, google_id),
  UNIQUE KEY uq_users_organization_apple_id (organization_id, apple_id),
  KEY idx_users_organization_ativo (organization_id, ativo),
  KEY idx_users_organization_role (organization_id, role),
  CONSTRAINT fk_users_organization
    FOREIGN KEY (organization_id)
    REFERENCES organizations (id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS clients (
  id CHAR(36) NOT NULL,
  organization_id CHAR(36) NOT NULL,
  nome VARCHAR(160) NOT NULL,
  telefone VARCHAR(30) NULL,
  email VARCHAR(160) NULL,
  observacoes TEXT NULL,
  ativo TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_clients_org_id (organization_id, id),
  KEY idx_clients_org_nome (organization_id, nome),
  KEY idx_clients_org_telefone (organization_id, telefone),
  KEY idx_clients_org_ativo (organization_id, ativo),
  CONSTRAINT fk_clients_organization
    FOREIGN KEY (organization_id)
    REFERENCES organizations (id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS services (
  id CHAR(36) NOT NULL,
  organization_id CHAR(36) NOT NULL,
  nome VARCHAR(160) NOT NULL,
  descricao TEXT NULL,
  duracao_minutos INT NOT NULL,
  valor_padrao DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  cor VARCHAR(20) NULL,
  ativo TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_services_org_id (organization_id, id),
  KEY idx_services_org_nome (organization_id, nome),
  KEY idx_services_org_ativo (organization_id, ativo),
  CONSTRAINT fk_services_organization
    FOREIGN KEY (organization_id)
    REFERENCES organizations (id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS appointments (
  id CHAR(36) NOT NULL,
  organization_id CHAR(36) NOT NULL,
  cliente_id CHAR(36) NOT NULL,
  cliente_nome VARCHAR(160) NOT NULL,
  cliente_email VARCHAR(160) NULL,
  servico_id CHAR(36) NOT NULL,
  servico_nome VARCHAR(160) NOT NULL,
  servico_cor VARCHAR(20) NULL,
  data DATE NOT NULL,
  horario_inicial TIME NOT NULL,
  horario_final TIME NOT NULL,
  valor DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  status ENUM('pendente', 'confirmado', 'concluido', 'cancelado') NOT NULL DEFAULT 'pendente',
  payment_status ENUM('pendente', 'pago') NOT NULL DEFAULT 'pendente',
  observacoes TEXT NULL,
  confirmacao_cliente ENUM('pendente', 'confirmado', 'cancelado', 'sem_resposta') NOT NULL DEFAULT 'pendente',
  lembrete_enviado TINYINT(1) NOT NULL DEFAULT 0,
  lembrete_confirmado TINYINT(1) NOT NULL DEFAULT 0,
  lembrete_cancelado TINYINT(1) NOT NULL DEFAULT 0,
  data_envio_lembrete DATETIME NULL,
  resposta_whatsapp TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_appointments_org_data_hora (organization_id, data, horario_inicial),
  KEY idx_appointments_org_cliente_data (organization_id, cliente_id, data),
  KEY idx_appointments_org_status_data (organization_id, status, data),
  KEY idx_appointments_org_payment_status_data (organization_id, payment_status, data),
  KEY idx_appointments_org_lembrete (organization_id, lembrete_enviado, data_envio_lembrete),
  CONSTRAINT fk_appointments_organization
    FOREIGN KEY (organization_id)
    REFERENCES organizations (id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,
  CONSTRAINT fk_appointments_client_same_tenant
    FOREIGN KEY (organization_id, cliente_id)
    REFERENCES clients (organization_id, id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,
  CONSTRAINT fk_appointments_service_same_tenant
    FOREIGN KEY (organization_id, servico_id)
    REFERENCES services (organization_id, id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS app_settings (
  id CHAR(36) NOT NULL,
  organization_id CHAR(36) NOT NULL,
  nome_negocio VARCHAR(160) NOT NULL,
  subtitulo VARCHAR(160) NULL,
  logo TEXT NULL,
  cor_primaria VARCHAR(20) NULL,
  hora_inicio_agenda TIME NOT NULL DEFAULT '08:00:00',
  hora_fim_agenda TIME NOT NULL DEFAULT '18:00:00',
  duracao_padrao INT NOT NULL DEFAULT 30,
  moeda VARCHAR(10) NOT NULL DEFAULT 'BRL',
  timezone VARCHAR(60) NOT NULL DEFAULT 'America/Sao_Paulo',
  criar_orcamentos TINYINT(1) NOT NULL DEFAULT 1,
  permitir_conflito TINYINT(1) NOT NULL DEFAULT 0,
  lembretes_ativos TINYINT(1) NOT NULL DEFAULT 1,
  lembrete_horas_antes INT NOT NULL DEFAULT 24,
  lembrete_mensagem TEXT NULL,
  whatsapp_ativo TINYINT(1) NOT NULL DEFAULT 0,
  whatsapp_api_provider VARCHAR(60) NULL,
  whatsapp_api_url TEXT NULL,
  whatsapp_api_token TEXT NULL,
  whatsapp_instance_id VARCHAR(120) NULL,
  whatsapp_tempo_lembrete_minutos INT NOT NULL DEFAULT 60,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_app_settings_organization (organization_id),
  CONSTRAINT fk_app_settings_organization
    FOREIGN KEY (organization_id)
    REFERENCES organizations (id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS platform_settings (
  id VARCHAR(64) NOT NULL,
  pix_key TEXT NULL,
  payment_grace_days INT NOT NULL DEFAULT 5,
  payment_alert_days INT NOT NULL DEFAULT 5,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DELIMITER $$

CREATE TRIGGER trg_organizations_updated_at
BEFORE UPDATE ON organizations
FOR EACH ROW
BEGIN
  SET NEW.updated_at = CURRENT_TIMESTAMP;
END$$

CREATE TRIGGER trg_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
BEGIN
  SET NEW.updated_at = CURRENT_TIMESTAMP;
END$$

CREATE TRIGGER trg_clients_updated_at
BEFORE UPDATE ON clients
FOR EACH ROW
BEGIN
  SET NEW.updated_at = CURRENT_TIMESTAMP;
END$$

CREATE TRIGGER trg_services_updated_at
BEFORE UPDATE ON services
FOR EACH ROW
BEGIN
  SET NEW.updated_at = CURRENT_TIMESTAMP;
END$$

CREATE TRIGGER trg_appointments_updated_at
BEFORE UPDATE ON appointments
FOR EACH ROW
BEGIN
  SET NEW.updated_at = CURRENT_TIMESTAMP;
END$$

CREATE TRIGGER trg_app_settings_updated_at
BEFORE UPDATE ON app_settings
FOR EACH ROW
BEGIN
  SET NEW.updated_at = CURRENT_TIMESTAMP;
END$$

DROP TRIGGER IF EXISTS trg_platform_settings_updated_at$$
CREATE TRIGGER trg_platform_settings_updated_at
BEFORE UPDATE ON platform_settings
FOR EACH ROW
BEGIN
  SET NEW.updated_at = CURRENT_TIMESTAMP;
END$$

DELIMITER ;

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
