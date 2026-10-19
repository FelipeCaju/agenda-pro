-- Execute no banco agendapro. Nao remove nem substitui dados existentes.
-- Estas tabelas tambem sao criadas pelo backend na inicializacao, se o usuario MySQL tiver permissao CREATE.
CREATE TABLE IF NOT EXISTS service_plans (
  id CHAR(36) NOT NULL PRIMARY KEY, organization_id CHAR(36) NOT NULL,
  name VARCHAR(160) NOT NULL, description TEXT NULL, price_cents INT UNSIGNED NOT NULL,
  duration_months TINYINT UNSIGNED NOT NULL, active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_service_plans_org (organization_id, active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS service_plan_services (
  organization_id CHAR(36) NOT NULL, plan_id CHAR(36) NOT NULL, service_id CHAR(36) NOT NULL,
  position INT UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (organization_id, plan_id, service_id), KEY idx_plan_services_plan (plan_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS service_plan_memberships (
  id CHAR(36) NOT NULL PRIMARY KEY, organization_id CHAR(36) NOT NULL,
  plan_id CHAR(36) NOT NULL, client_id CHAR(36) NOT NULL, professional_id CHAR(36) NULL,
  plan_name VARCHAR(160) NOT NULL, service_ids TEXT NOT NULL, duration_months TINYINT UNSIGNED NOT NULL,
  price_cents INT UNSIGNED NOT NULL, anchor_date DATE NOT NULL, end_date DATE NOT NULL,
  start_time TIME NOT NULL, created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_plan_memberships_org_end (organization_id, end_date), KEY idx_plan_memberships_client (organization_id, client_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS service_plan_periods (
  id CHAR(36) NOT NULL PRIMARY KEY, organization_id CHAR(36) NOT NULL, membership_id CHAR(36) NOT NULL,
  start_date DATE NOT NULL, end_date DATE NOT NULL, amount_cents INT UNSIGNED NOT NULL,
  paid_at DATETIME NOT NULL, UNIQUE KEY idx_plan_period_unique (organization_id, membership_id, start_date),
  KEY idx_plan_period_paid (organization_id, paid_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS service_plan_appointments (
  organization_id CHAR(36) NOT NULL, membership_id CHAR(36) NOT NULL,
  period_id CHAR(36) NOT NULL, appointment_id CHAR(36) NOT NULL,
  PRIMARY KEY (organization_id, appointment_id), KEY idx_plan_appointments_membership (organization_id, membership_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS service_plan_reminders (
  organization_id CHAR(36) NOT NULL, period_id CHAR(36) NOT NULL,
  status VARCHAR(20) NOT NULL, error_message TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (organization_id, period_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS whatsapp_delivery_guards (
  organization_id CHAR(36) NOT NULL, kind VARCHAR(24) NOT NULL, item_id CHAR(36) NOT NULL,
  status VARCHAR(20) NOT NULL, last_error TEXT NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (organization_id, kind, item_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
