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

CREATE TABLE IF NOT EXISTS professionals (
  id CHAR(36) NOT NULL,
  organization_id CHAR(36) NOT NULL,
  nome VARCHAR(160) NOT NULL,
  atividade VARCHAR(160) NULL,
  ativo TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_professionals_org_id (organization_id, id),
  KEY idx_professionals_org_nome (organization_id, nome),
  KEY idx_professionals_org_ativo (organization_id, ativo),
  CONSTRAINT fk_professionals_organization
    FOREIGN KEY (organization_id)
    REFERENCES organizations (id)
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

CREATE TABLE IF NOT EXISTS appointments (
  id CHAR(36) NOT NULL,
  organization_id CHAR(36) NOT NULL,
  cliente_id CHAR(36) NOT NULL,
  cliente_nome VARCHAR(160) NOT NULL,
  cliente_email VARCHAR(160) NULL,
  servico_id CHAR(36) NOT NULL,
  servico_nome VARCHAR(160) NOT NULL,
  servico_cor VARCHAR(20) NULL,
  profissional_id CHAR(36) NULL,
  profissional_nome VARCHAR(160) NULL,
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
  quote_id CHAR(36) NULL,
  service_order_id CHAR(36) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_appointments_org_data_hora (organization_id, data, horario_inicial),
  KEY idx_appointments_org_cliente_data (organization_id, cliente_id, data),
  KEY idx_appointments_org_status_data (organization_id, status, data),
  KEY idx_appointments_org_payment_status_data (organization_id, payment_status, data),
  KEY idx_appointments_org_lembrete (organization_id, lembrete_enviado, data_envio_lembrete),
  KEY idx_appointments_org_profissional_data (organization_id, profissional_id, data, horario_inicial),
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
    ON UPDATE CASCADE,
  CONSTRAINT fk_appointments_professional_same_tenant
    FOREIGN KEY (organization_id, profissional_id)
    REFERENCES professionals (organization_id, id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS professional_services (
  id CHAR(36) NOT NULL,
  organization_id CHAR(36) NOT NULL,
  professional_id CHAR(36) NOT NULL,
  service_id CHAR(36) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_professional_services_org_pair (organization_id, professional_id, service_id),
  KEY idx_professional_services_org_service (organization_id, service_id),
  KEY idx_professional_services_org_professional (organization_id, professional_id),
  CONSTRAINT fk_professional_services_organization
    FOREIGN KEY (organization_id)
    REFERENCES organizations (id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,
  CONSTRAINT fk_professional_services_professional_same_tenant
    FOREIGN KEY (organization_id, professional_id)
    REFERENCES professionals (organization_id, id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_professional_services_service_same_tenant
    FOREIGN KEY (organization_id, service_id)
    REFERENCES services (organization_id, id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS blocked_slots (
  id CHAR(36) NOT NULL,
  organization_id CHAR(36) NOT NULL,
  professional_id CHAR(36) NULL,
  data DATE NOT NULL,
  horario_inicial TIME NOT NULL,
  horario_final TIME NOT NULL,
  motivo VARCHAR(255) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_blocked_slots_org_data (organization_id, data, horario_inicial),
  KEY idx_blocked_slots_org_professional (organization_id, professional_id, data),
  CONSTRAINT fk_blocked_slots_organization
    FOREIGN KEY (organization_id)
    REFERENCES organizations (id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,
  CONSTRAINT fk_blocked_slots_professional_same_tenant
    FOREIGN KEY (organization_id, professional_id)
    REFERENCES professionals (organization_id, id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS quotes (
  id CHAR(36) NOT NULL,
  organization_id CHAR(36) NOT NULL,
  cliente_id CHAR(36) NOT NULL,
  cliente_nome VARCHAR(160) NOT NULL,
  status ENUM('pendente', 'aprovado', 'recusado') NOT NULL DEFAULT 'pendente',
  subtotal DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  desconto DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  valor_total DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  observacoes TEXT NULL,
  appointment_id CHAR(36) NULL,
  service_order_id CHAR(36) NULL,
  approved_at DATETIME NULL,
  rejected_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_quotes_org_status_created (organization_id, status, created_at),
  KEY idx_quotes_org_cliente_created (organization_id, cliente_id, created_at),
  CONSTRAINT fk_quotes_organization
    FOREIGN KEY (organization_id)
    REFERENCES organizations (id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,
  CONSTRAINT fk_quotes_client_same_tenant
    FOREIGN KEY (organization_id, cliente_id)
    REFERENCES clients (organization_id, id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS quote_items (
  id CHAR(36) NOT NULL,
  organization_id CHAR(36) NOT NULL,
  quote_id CHAR(36) NOT NULL,
  servico_id CHAR(36) NULL,
  servico_nome VARCHAR(160) NOT NULL,
  descricao_livre VARCHAR(255) NULL,
  quantidade DECIMAL(10,2) NOT NULL DEFAULT 1.00,
  valor_unitario DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  valor_total DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  observacoes VARCHAR(255) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_quote_items_quote (quote_id),
  KEY idx_quote_items_org_quote (organization_id, quote_id),
  CONSTRAINT fk_quote_items_quote
    FOREIGN KEY (quote_id)
    REFERENCES quotes (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS service_orders (
  id CHAR(36) NOT NULL,
  organization_id CHAR(36) NOT NULL,
  quote_id CHAR(36) NULL,
  cliente_id CHAR(36) NOT NULL,
  cliente_nome VARCHAR(160) NOT NULL,
  status ENUM('aberta', 'em_execucao', 'concluida', 'cancelada') NOT NULL DEFAULT 'aberta',
  subtotal DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  desconto DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  valor_total DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  observacoes TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_service_orders_org_status_created (organization_id, status, created_at),
  CONSTRAINT fk_service_orders_organization
    FOREIGN KEY (organization_id)
    REFERENCES organizations (id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS service_order_items (
  id CHAR(36) NOT NULL,
  organization_id CHAR(36) NOT NULL,
  service_order_id CHAR(36) NOT NULL,
  servico_id CHAR(36) NULL,
  servico_nome VARCHAR(160) NOT NULL,
  descricao_livre VARCHAR(255) NULL,
  quantidade DECIMAL(10,2) NOT NULL DEFAULT 1.00,
  valor_unitario DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  valor_total DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  observacoes VARCHAR(255) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_service_order_items_order (service_order_id),
  CONSTRAINT fk_service_order_items_order
    FOREIGN KEY (service_order_id)
    REFERENCES service_orders (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS organization_payments (
  id CHAR(36) NOT NULL,
  organization_id CHAR(36) NOT NULL,
  reference_month CHAR(7) NOT NULL,
  amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  status ENUM('pending', 'paid', 'overdue', 'canceled') NOT NULL DEFAULT 'pending',
  paid_at DATETIME NULL,
  due_date DATE NULL,
  payment_method VARCHAR(60) NULL,
  notes TEXT NULL,
  customer_notified_paid_at DATETIME NULL,
  customer_payment_note TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_org_payments_org_month (organization_id, reference_month),
  KEY idx_org_payments_org_status (organization_id, status),
  KEY idx_org_payments_due_date (due_date),
  CONSTRAINT fk_org_payments_organization
    FOREIGN KEY (organization_id)
    REFERENCES organizations (id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DELIMITER $$

DROP TRIGGER IF EXISTS trg_organizations_updated_at$$
CREATE TRIGGER trg_organizations_updated_at
BEFORE UPDATE ON organizations
FOR EACH ROW
BEGIN
  SET NEW.updated_at = CURRENT_TIMESTAMP;
END$$

DROP TRIGGER IF EXISTS trg_users_updated_at$$
CREATE TRIGGER trg_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
BEGIN
  SET NEW.updated_at = CURRENT_TIMESTAMP;
END$$

DROP TRIGGER IF EXISTS trg_clients_updated_at$$
CREATE TRIGGER trg_clients_updated_at
BEFORE UPDATE ON clients
FOR EACH ROW
BEGIN
  SET NEW.updated_at = CURRENT_TIMESTAMP;
END$$

DROP TRIGGER IF EXISTS trg_services_updated_at$$
CREATE TRIGGER trg_services_updated_at
BEFORE UPDATE ON services
FOR EACH ROW
BEGIN
  SET NEW.updated_at = CURRENT_TIMESTAMP;
END$$

DROP TRIGGER IF EXISTS trg_professionals_updated_at$$
CREATE TRIGGER trg_professionals_updated_at
BEFORE UPDATE ON professionals
FOR EACH ROW
BEGIN
  SET NEW.updated_at = CURRENT_TIMESTAMP;
END$$

DROP TRIGGER IF EXISTS trg_professional_services_updated_at$$
CREATE TRIGGER trg_professional_services_updated_at
BEFORE UPDATE ON professional_services
FOR EACH ROW
BEGIN
  SET NEW.updated_at = CURRENT_TIMESTAMP;
END$$

DROP TRIGGER IF EXISTS trg_blocked_slots_updated_at$$
CREATE TRIGGER trg_blocked_slots_updated_at
BEFORE UPDATE ON blocked_slots
FOR EACH ROW
BEGIN
  SET NEW.updated_at = CURRENT_TIMESTAMP;
END$$

DROP TRIGGER IF EXISTS trg_appointments_updated_at$$
CREATE TRIGGER trg_appointments_updated_at
BEFORE UPDATE ON appointments
FOR EACH ROW
BEGIN
  SET NEW.updated_at = CURRENT_TIMESTAMP;
END$$

DROP TRIGGER IF EXISTS trg_app_settings_updated_at$$
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

DROP TRIGGER IF EXISTS trg_organization_payments_updated_at$$
CREATE TRIGGER trg_organization_payments_updated_at
BEFORE UPDATE ON organization_payments
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
