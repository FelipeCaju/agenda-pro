USE agendapro;

CREATE TABLE IF NOT EXISTS subscription_plans (
  id CHAR(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  name VARCHAR(120) COLLATE utf8mb4_unicode_ci NOT NULL,
  code VARCHAR(60) COLLATE utf8mb4_unicode_ci NOT NULL,
  description VARCHAR(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  price_cents INT UNSIGNED NOT NULL,
  currency CHAR(3) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'BRL',
  billing_cycle ENUM('monthly','quarterly','semiannual','annual') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'monthly',
  trial_days SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  grace_days SMALLINT UNSIGNED NOT NULL DEFAULT 3,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  gateway ENUM('asaas') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'asaas',
  gateway_plan_id VARCHAR(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_subscription_plans_code (code),
  KEY idx_subscription_plans_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO subscription_plans (
  id, name, code, description, price_cents, currency, billing_cycle,
  trial_days, grace_days, is_active, gateway, gateway_plan_id, created_at, updated_at
)
SELECT
  'plan-agendapro-mensal',
  'AgendaPro Mensal',
  'agenda_pro_mensal',
  'Plano mensal padrao do AgendaPro',
  2990,
  'BRL',
  'monthly',
  0,
  3,
  1,
  'asaas',
  NULL,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM DUAL
WHERE NOT EXISTS (
  SELECT 1 FROM subscription_plans WHERE code = 'agenda_pro_mensal'
);

CREATE TABLE IF NOT EXISTS organization_subscriptions (
  id CHAR(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  organization_id CHAR(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  plan_id CHAR(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  gateway ENUM('asaas') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'asaas',
  gateway_customer_id VARCHAR(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  gateway_subscription_id VARCHAR(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  status ENUM('trialing','pending_payment','active','past_due','cancelled','expired','blocked') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending_payment',
  billing_cycle ENUM('monthly','quarterly','semiannual','annual') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'monthly',
  amount_cents INT UNSIGNED NOT NULL,
  currency CHAR(3) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'BRL',
  trial_starts_at DATETIME DEFAULT NULL,
  trial_ends_at DATETIME DEFAULT NULL,
  current_period_start DATETIME DEFAULT NULL,
  current_period_end DATETIME DEFAULT NULL,
  next_due_date DATE DEFAULT NULL,
  grace_until DATETIME DEFAULT NULL,
  cancel_at_period_end TINYINT(1) NOT NULL DEFAULT 0,
  cancelled_at DATETIME DEFAULT NULL,
  expired_at DATETIME DEFAULT NULL,
  blocked_at DATETIME DEFAULT NULL,
  reactivated_at DATETIME DEFAULT NULL,
  last_payment_at DATETIME DEFAULT NULL,
  last_status_change_at DATETIME DEFAULT NULL,
  notes TEXT COLLATE utf8mb4_unicode_ci,
  metadata_text LONGTEXT COLLATE utf8mb4_unicode_ci,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_org_subscriptions_organization
    FOREIGN KEY (organization_id) REFERENCES organizations (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_org_subscriptions_plan
    FOREIGN KEY (plan_id) REFERENCES subscription_plans (id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,
  UNIQUE KEY uk_org_subscriptions_gateway_subscription (gateway_subscription_id),
  UNIQUE KEY uk_org_subscriptions_org (organization_id),
  KEY idx_org_subscriptions_plan (plan_id),
  KEY idx_org_subscriptions_status (status),
  KEY idx_org_subscriptions_due_date (next_due_date),
  KEY idx_org_subscriptions_org_status (organization_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS billing_transactions (
  id CHAR(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  organization_id CHAR(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  subscription_id CHAR(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  plan_id CHAR(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  gateway ENUM('asaas') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'asaas',
  gateway_payment_id VARCHAR(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  gateway_invoice_id VARCHAR(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  gateway_charge_id VARCHAR(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  gateway_event_reference VARCHAR(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  transaction_type ENUM('subscription','invoice','retry','manual') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'subscription',
  payment_method ENUM('pix','credit_card','boleto','unknown') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'unknown',
  status ENUM('pending','received','confirmed','overdue','refunded','failed','cancelled') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  description VARCHAR(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  amount_cents INT UNSIGNED NOT NULL,
  net_amount_cents INT UNSIGNED DEFAULT NULL,
  fee_cents INT UNSIGNED DEFAULT NULL,
  currency CHAR(3) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'BRL',
  installment_count SMALLINT UNSIGNED NOT NULL DEFAULT 1,
  due_date DATE DEFAULT NULL,
  paid_at DATETIME DEFAULT NULL,
  confirmed_at DATETIME DEFAULT NULL,
  overdue_at DATETIME DEFAULT NULL,
  refunded_at DATETIME DEFAULT NULL,
  cancelled_at DATETIME DEFAULT NULL,
  invoice_url VARCHAR(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  bank_slip_url VARCHAR(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  pix_qr_code_text TEXT COLLATE utf8mb4_unicode_ci,
  pix_qr_code_image_url VARCHAR(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  card_brand VARCHAR(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  card_last4 CHAR(4) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  external_reference VARCHAR(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  notes TEXT COLLATE utf8mb4_unicode_ci,
  metadata_text LONGTEXT COLLATE utf8mb4_unicode_ci,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_billing_transactions_organization
    FOREIGN KEY (organization_id) REFERENCES organizations (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_billing_transactions_subscription
    FOREIGN KEY (subscription_id) REFERENCES organization_subscriptions (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_billing_transactions_plan
    FOREIGN KEY (plan_id) REFERENCES subscription_plans (id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,
  UNIQUE KEY uk_billing_transactions_gateway_payment (gateway_payment_id),
  UNIQUE KEY uk_billing_transactions_gateway_invoice (gateway_invoice_id),
  KEY idx_billing_transactions_org (organization_id),
  KEY idx_billing_transactions_subscription (subscription_id),
  KEY idx_billing_transactions_plan (plan_id),
  KEY idx_billing_transactions_status (status),
  KEY idx_billing_transactions_due_date (due_date),
  KEY idx_billing_transactions_paid_at (paid_at),
  KEY idx_billing_transactions_org_status (organization_id, status),
  KEY idx_billing_transactions_org_due_date (organization_id, due_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS webhook_events (
  id CHAR(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  gateway ENUM('asaas') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'asaas',
  event_id VARCHAR(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  event_type VARCHAR(120) COLLATE utf8mb4_unicode_ci NOT NULL,
  organization_id CHAR(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  subscription_id CHAR(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  billing_transaction_id CHAR(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  webhook_token_received VARCHAR(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  signature_valid TINYINT(1) NOT NULL DEFAULT 0,
  payload_text LONGTEXT COLLATE utf8mb4_unicode_ci NOT NULL,
  processed TINYINT(1) NOT NULL DEFAULT 0,
  processed_at DATETIME DEFAULT NULL,
  processing_attempts INT UNSIGNED NOT NULL DEFAULT 0,
  processing_error TEXT COLLATE utf8mb4_unicode_ci,
  received_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_webhook_events_organization
    FOREIGN KEY (organization_id) REFERENCES organizations (id)
    ON DELETE SET NULL
    ON UPDATE CASCADE,
  CONSTRAINT fk_webhook_events_subscription
    FOREIGN KEY (subscription_id) REFERENCES organization_subscriptions (id)
    ON DELETE SET NULL
    ON UPDATE CASCADE,
  CONSTRAINT fk_webhook_events_transaction
    FOREIGN KEY (billing_transaction_id) REFERENCES billing_transactions (id)
    ON DELETE SET NULL
    ON UPDATE CASCADE,
  UNIQUE KEY uk_webhook_events_gateway_event (gateway, event_id),
  KEY idx_webhook_events_event_type (event_type),
  KEY idx_webhook_events_processed (processed),
  KEY idx_webhook_events_received_at (received_at),
  KEY idx_webhook_events_org (organization_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS organization_access_locks (
  id CHAR(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  organization_id CHAR(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  is_locked TINYINT(1) NOT NULL DEFAULT 0,
  lock_reason ENUM('manual','payment_overdue','subscription_cancelled','subscription_expired','security') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  locked_at DATETIME DEFAULT NULL,
  unlocked_at DATETIME DEFAULT NULL,
  grace_until DATETIME DEFAULT NULL,
  related_subscription_id CHAR(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  related_transaction_id CHAR(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  notes VARCHAR(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  metadata_text LONGTEXT COLLATE utf8mb4_unicode_ci,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_org_access_locks_organization
    FOREIGN KEY (organization_id) REFERENCES organizations (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_org_access_locks_subscription
    FOREIGN KEY (related_subscription_id) REFERENCES organization_subscriptions (id)
    ON DELETE SET NULL
    ON UPDATE CASCADE,
  CONSTRAINT fk_org_access_locks_transaction
    FOREIGN KEY (related_transaction_id) REFERENCES billing_transactions (id)
    ON DELETE SET NULL
    ON UPDATE CASCADE,
  UNIQUE KEY uk_org_access_locks_organization (organization_id),
  KEY idx_org_access_locks_is_locked (is_locked),
  KEY idx_org_access_locks_grace_until (grace_until)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DELIMITER $$

DROP TRIGGER IF EXISTS trg_subscription_plans_updated_at$$
CREATE TRIGGER trg_subscription_plans_updated_at
BEFORE UPDATE ON subscription_plans
FOR EACH ROW
BEGIN
  SET NEW.updated_at = CURRENT_TIMESTAMP;
END$$

DROP TRIGGER IF EXISTS trg_organization_subscriptions_updated_at$$
CREATE TRIGGER trg_organization_subscriptions_updated_at
BEFORE UPDATE ON organization_subscriptions
FOR EACH ROW
BEGIN
  SET NEW.updated_at = CURRENT_TIMESTAMP;
END$$

DROP TRIGGER IF EXISTS trg_billing_transactions_updated_at$$
CREATE TRIGGER trg_billing_transactions_updated_at
BEFORE UPDATE ON billing_transactions
FOR EACH ROW
BEGIN
  SET NEW.updated_at = CURRENT_TIMESTAMP;
END$$

DROP TRIGGER IF EXISTS trg_organization_access_locks_updated_at$$
CREATE TRIGGER trg_organization_access_locks_updated_at
BEFORE UPDATE ON organization_access_locks
FOR EACH ROW
BEGIN
  SET NEW.updated_at = CURRENT_TIMESTAMP;
END$$

DELIMITER ;
