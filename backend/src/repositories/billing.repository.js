import { randomUUID } from "node:crypto";
import { execute, query, withTransaction } from "../lib/database.js";
import {
  BILLING_GRACE_DAYS,
  DEFAULT_BILLING_CYCLE,
  DEFAULT_CURRENCY,
  DEFAULT_GATEWAY,
  DEFAULT_PLAN_CODE,
  DEFAULT_PLAN_NAME,
  DEFAULT_PLAN_PRICE_CENTS,
  formatDateForDatabase,
  formatDateTimeForDatabase,
  mapLegacySubscriptionStatus,
  normalizeBillingCycle,
  normalizeBillingStatus,
  normalizeBillingTransactionStatus,
  normalizePaymentMethod,
} from "../lib/billing-status.js";

function normalizeDateTime(value) {
  if (!value) {
    return null;
  }

  return value.includes("T") ? value : value.replace(" ", "T");
}

function dbQuery(connection, sql, params = []) {
  return connection ? connection.query(sql, params).then(([rows]) => rows) : query(sql, params);
}

function dbExecute(connection, sql, params = []) {
  return connection ? connection.execute(sql, params).then(([result]) => result) : execute(sql, params);
}

async function hasTable(tableName) {
  const rows = await query("SHOW TABLES LIKE ?", [tableName]);
  return rows.length > 0;
}

async function hasIndex(tableName, indexName) {
  const rows = await query(
    `SELECT 1
      FROM information_schema.statistics
      WHERE table_schema = DATABASE()
        AND table_name = ?
        AND index_name = ?
      LIMIT 1`,
    [tableName, indexName],
  );

  return rows.length > 0;
}

async function listTableTriggers(tableName) {
  const rows = await query(
    `SELECT trigger_name, action_timing, event_manipulation
      FROM information_schema.triggers
      WHERE trigger_schema = DATABASE()
        AND event_object_table = ?`,
    [tableName],
  );

  return rows;
}

async function ensureIndex(tableName, indexName, ddl) {
  if (await hasIndex(tableName, indexName)) {
    return;
  }

  await execute(ddl);
}

function buildUpdateStatement(input) {
  const entries = Object.entries(input).filter(([, value]) => value !== undefined);

  if (!entries.length) {
    return null;
  }

  return {
    sql: entries.map(([field]) => `${field} = ?`).join(", "),
    params: entries.map(([, value]) => value),
  };
}

function mapPlan(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    name: row.name,
    code: row.code,
    description: row.description ?? null,
    price_cents: Number(row.price_cents ?? 0),
    currency: row.currency ?? DEFAULT_CURRENCY,
    billing_cycle: row.billing_cycle ?? DEFAULT_BILLING_CYCLE,
    trial_days: Number(row.trial_days ?? 0),
    grace_days: Number(row.grace_days ?? BILLING_GRACE_DAYS),
    is_active: Boolean(row.is_active),
    gateway: row.gateway ?? DEFAULT_GATEWAY,
    gateway_plan_id: row.gateway_plan_id ?? null,
    created_at: normalizeDateTime(row.created_at),
    updated_at: normalizeDateTime(row.updated_at),
  };
}

function mapSubscription(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    organization_id: row.organization_id,
    plan_id: row.plan_id,
    gateway: row.gateway ?? DEFAULT_GATEWAY,
    gateway_customer_id: row.gateway_customer_id ?? null,
    gateway_subscription_id: row.gateway_subscription_id ?? null,
    status: normalizeBillingStatus(row.status),
    billing_cycle: normalizeBillingCycle(row.billing_cycle),
    amount_cents: Number(row.amount_cents ?? 0),
    currency: row.currency ?? DEFAULT_CURRENCY,
    trial_starts_at: normalizeDateTime(row.trial_starts_at),
    trial_ends_at: normalizeDateTime(row.trial_ends_at),
    current_period_start: normalizeDateTime(row.current_period_start),
    current_period_end: normalizeDateTime(row.current_period_end),
    next_due_date: row.next_due_date ?? null,
    grace_until: normalizeDateTime(row.grace_until),
    cancel_at_period_end: Boolean(row.cancel_at_period_end),
    cancelled_at: normalizeDateTime(row.cancelled_at),
    expired_at: normalizeDateTime(row.expired_at),
    blocked_at: normalizeDateTime(row.blocked_at),
    reactivated_at: normalizeDateTime(row.reactivated_at),
    last_payment_at: normalizeDateTime(row.last_payment_at),
    last_status_change_at: normalizeDateTime(row.last_status_change_at),
    notes: row.notes ?? null,
    metadata_text: row.metadata_text ?? null,
    created_at: normalizeDateTime(row.created_at),
    updated_at: normalizeDateTime(row.updated_at),
  };
}

function mapTransaction(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    organization_id: row.organization_id,
    subscription_id: row.subscription_id,
    plan_id: row.plan_id,
    gateway: row.gateway ?? DEFAULT_GATEWAY,
    gateway_payment_id: row.gateway_payment_id ?? null,
    gateway_invoice_id: row.gateway_invoice_id ?? null,
    gateway_charge_id: row.gateway_charge_id ?? null,
    gateway_event_reference: row.gateway_event_reference ?? null,
    transaction_type: row.transaction_type ?? "subscription",
    payment_method: normalizePaymentMethod(row.payment_method),
    status: normalizeBillingTransactionStatus(row.status),
    description: row.description ?? null,
    amount_cents: Number(row.amount_cents ?? 0),
    net_amount_cents: row.net_amount_cents === null ? null : Number(row.net_amount_cents),
    fee_cents: row.fee_cents === null ? null : Number(row.fee_cents),
    currency: row.currency ?? DEFAULT_CURRENCY,
    installment_count: Number(row.installment_count ?? 1),
    due_date: row.due_date ?? null,
    paid_at: normalizeDateTime(row.paid_at),
    confirmed_at: normalizeDateTime(row.confirmed_at),
    overdue_at: normalizeDateTime(row.overdue_at),
    refunded_at: normalizeDateTime(row.refunded_at),
    cancelled_at: normalizeDateTime(row.cancelled_at),
    invoice_url: row.invoice_url ?? null,
    bank_slip_url: row.bank_slip_url ?? null,
    pix_qr_code_text: row.pix_qr_code_text ?? null,
    pix_qr_code_image_url: row.pix_qr_code_image_url ?? null,
    card_brand: row.card_brand ?? null,
    card_last4: row.card_last4 ?? null,
    external_reference: row.external_reference ?? null,
    notes: row.notes ?? null,
    metadata_text: row.metadata_text ?? null,
    created_at: normalizeDateTime(row.created_at),
    updated_at: normalizeDateTime(row.updated_at),
  };
}

function mapAccessLock(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    organization_id: row.organization_id,
    is_locked: Boolean(row.is_locked),
    lock_reason: row.lock_reason ?? null,
    locked_at: normalizeDateTime(row.locked_at),
    unlocked_at: normalizeDateTime(row.unlocked_at),
    grace_until: normalizeDateTime(row.grace_until),
    related_subscription_id: row.related_subscription_id ?? null,
    related_transaction_id: row.related_transaction_id ?? null,
    notes: row.notes ?? null,
    metadata_text: row.metadata_text ?? null,
    created_at: normalizeDateTime(row.created_at),
    updated_at: normalizeDateTime(row.updated_at),
  };
}

function mapWebhookEvent(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    gateway: row.gateway ?? DEFAULT_GATEWAY,
    event_id: row.event_id,
    event_type: row.event_type,
    organization_id: row.organization_id ?? null,
    subscription_id: row.subscription_id ?? null,
    billing_transaction_id: row.billing_transaction_id ?? null,
    webhook_token_received: row.webhook_token_received ?? null,
    signature_valid: Boolean(row.signature_valid),
    payload_text: row.payload_text,
    processed: Boolean(row.processed),
    processed_at: normalizeDateTime(row.processed_at),
    processing_attempts: Number(row.processing_attempts ?? 0),
    processing_error: row.processing_error ?? null,
    received_at: normalizeDateTime(row.received_at),
    created_at: normalizeDateTime(row.created_at),
  };
}

async function ensureBillingTables() {
  await execute(
    `CREATE TABLE IF NOT EXISTS subscription_plans (
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
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  );

  await execute(
    `CREATE TABLE IF NOT EXISTS organization_subscriptions (
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
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  );

  await execute(
    `CREATE TABLE IF NOT EXISTS billing_transactions (
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
      pix_qr_code_image_url LONGTEXT COLLATE utf8mb4_unicode_ci,
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
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  );

  await execute(
    `CREATE TABLE IF NOT EXISTS webhook_events (
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
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  );

  await execute(
    `CREATE TABLE IF NOT EXISTS organization_access_locks (
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
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  );
}

async function ensureBillingTriggers() {
  const triggerStatements = [
    {
      table: "subscription_plans",
      name: "trg_subscription_plans_updated_at",
      drop: "DROP TRIGGER IF EXISTS trg_subscription_plans_updated_at",
      create: `CREATE TRIGGER trg_subscription_plans_updated_at
        BEFORE UPDATE ON subscription_plans
        FOR EACH ROW
        BEGIN
          SET NEW.updated_at = CURRENT_TIMESTAMP;
        END`,
    },
    {
      table: "organization_subscriptions",
      name: "trg_organization_subscriptions_updated_at",
      drop: "DROP TRIGGER IF EXISTS trg_organization_subscriptions_updated_at",
      create: `CREATE TRIGGER trg_organization_subscriptions_updated_at
        BEFORE UPDATE ON organization_subscriptions
        FOR EACH ROW
        BEGIN
          SET NEW.updated_at = CURRENT_TIMESTAMP;
        END`,
    },
    {
      table: "billing_transactions",
      name: "trg_billing_transactions_updated_at",
      drop: "DROP TRIGGER IF EXISTS trg_billing_transactions_updated_at",
      create: `CREATE TRIGGER trg_billing_transactions_updated_at
        BEFORE UPDATE ON billing_transactions
        FOR EACH ROW
        BEGIN
          SET NEW.updated_at = CURRENT_TIMESTAMP;
        END`,
    },
    {
      table: "organization_access_locks",
      name: "trg_organization_access_locks_updated_at",
      drop: "DROP TRIGGER IF EXISTS trg_organization_access_locks_updated_at",
      create: `CREATE TRIGGER trg_organization_access_locks_updated_at
        BEFORE UPDATE ON organization_access_locks
        FOR EACH ROW
        BEGIN
          SET NEW.updated_at = CURRENT_TIMESTAMP;
        END`,
    },
  ];

  for (const statement of triggerStatements) {
    const existingTriggers = await listTableTriggers(statement.table);
    const hasCompatibleBeforeUpdateTrigger = existingTriggers.some(
      (trigger) =>
        String(trigger.action_timing ?? "").toUpperCase() === "BEFORE" &&
        String(trigger.event_manipulation ?? "").toUpperCase() === "UPDATE",
    );
    const hasOurTrigger = existingTriggers.some(
      (trigger) => String(trigger.trigger_name ?? "") === statement.name,
    );

    if (hasCompatibleBeforeUpdateTrigger && !hasOurTrigger) {
      continue;
    }

    await query(statement.drop);
    await query(statement.create);
  }
}

async function ensureDefaultPlan() {
  const rows = await query("SELECT id FROM subscription_plans WHERE code = ? LIMIT 1", [DEFAULT_PLAN_CODE]);

  if (rows.length) {
    return;
  }

  await execute(
    `INSERT INTO subscription_plans (
      id, name, code, description, price_cents, currency, billing_cycle,
      trial_days, grace_days, is_active, gateway, gateway_plan_id, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
    [
      "plan-agendapro-mensal",
      DEFAULT_PLAN_NAME,
      DEFAULT_PLAN_CODE,
      "Plano mensal padrao do AgendaPro",
      DEFAULT_PLAN_PRICE_CENTS,
      DEFAULT_CURRENCY,
      DEFAULT_BILLING_CYCLE,
      0,
      BILLING_GRACE_DAYS,
      1,
      DEFAULT_GATEWAY,
      null,
    ],
  );
}

let billingInfrastructurePromise = null;

async function ensureBillingInfrastructureInternal() {
  if (!(await hasTable("organizations"))) {
    return;
  }

  await ensureBillingTables();
  await ensureBillingTriggers();
  await ensureDefaultPlan();
  await ensureIndex(
    "organization_subscriptions",
    "idx_org_subscriptions_gateway_customer",
    "ALTER TABLE organization_subscriptions ADD KEY idx_org_subscriptions_gateway_customer (gateway_customer_id)",
  );
  await ensureIndex(
    "billing_transactions",
    "idx_billing_transactions_external_reference",
    "ALTER TABLE billing_transactions ADD KEY idx_billing_transactions_external_reference (external_reference)",
  );
  await execute(
    `ALTER TABLE billing_transactions
      MODIFY COLUMN pix_qr_code_image_url LONGTEXT COLLATE utf8mb4_unicode_ci NULL`,
  );
}

export async function ensureBillingInfrastructure() {
  if (!billingInfrastructurePromise) {
    billingInfrastructurePromise = ensureBillingInfrastructureInternal().catch((error) => {
      billingInfrastructurePromise = null;
      throw error;
    });
  }

  return billingInfrastructurePromise;
}

export async function getBillingOrganizationSummary(organizationId) {
  const rows = await query(
    `SELECT id, nome_empresa, email_responsavel, telefone, cpf_cnpj, billing_address,
      billing_address_number, billing_address_complement, billing_postal_code, billing_province,
      billing_city_ibge, monthly_amount, subscription_status, subscription_plan, due_date, trial_end
      FROM organizations
      WHERE id = ?
      LIMIT 1`,
    [organizationId],
  );

  return rows[0] ?? null;
}

export async function getSubscriptionPlanByCode(code = DEFAULT_PLAN_CODE) {
  const rows = await query(
    "SELECT * FROM subscription_plans WHERE code = ? AND is_active = 1 LIMIT 1",
    [code],
  );

  return mapPlan(rows[0]);
}

export async function getSubscriptionPlanById(planId) {
  const rows = await query("SELECT * FROM subscription_plans WHERE id = ? LIMIT 1", [planId]);
  return mapPlan(rows[0]);
}

export async function getOrganizationSubscriptionByOrganizationId(organizationId) {
  const rows = await query(
    "SELECT * FROM organization_subscriptions WHERE organization_id = ? LIMIT 1",
    [organizationId],
  );

  return mapSubscription(rows[0]);
}

export async function getOrganizationSubscriptionByGatewaySubscriptionId(gatewaySubscriptionId) {
  const rows = await query(
    "SELECT * FROM organization_subscriptions WHERE gateway_subscription_id = ? LIMIT 1",
    [gatewaySubscriptionId],
  );

  return mapSubscription(rows[0]);
}

export async function getOrganizationSubscriptionByGatewayCustomerId(gatewayCustomerId) {
  const rows = await query(
    "SELECT * FROM organization_subscriptions WHERE gateway_customer_id = ? LIMIT 1",
    [gatewayCustomerId],
  );

  return mapSubscription(rows[0]);
}

export async function createOrganizationSubscription(input, connection = null) {
  const id = input.id ?? randomUUID();

  await dbExecute(
    connection,
    `INSERT INTO organization_subscriptions (
      id, organization_id, plan_id, gateway, gateway_customer_id, gateway_subscription_id, status,
      billing_cycle, amount_cents, currency, trial_starts_at, trial_ends_at, current_period_start,
      current_period_end, next_due_date, grace_until, cancel_at_period_end, cancelled_at, expired_at,
      blocked_at, reactivated_at, last_payment_at, last_status_change_at, notes, metadata_text
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      input.organization_id,
      input.plan_id,
      input.gateway ?? DEFAULT_GATEWAY,
      input.gateway_customer_id ?? null,
      input.gateway_subscription_id ?? null,
      normalizeBillingStatus(input.status),
      normalizeBillingCycle(input.billing_cycle),
      Number(input.amount_cents ?? 0),
      input.currency ?? DEFAULT_CURRENCY,
      formatDateTimeForDatabase(input.trial_starts_at),
      formatDateTimeForDatabase(input.trial_ends_at),
      formatDateTimeForDatabase(input.current_period_start),
      formatDateTimeForDatabase(input.current_period_end),
      formatDateForDatabase(input.next_due_date),
      formatDateTimeForDatabase(input.grace_until),
      input.cancel_at_period_end ? 1 : 0,
      formatDateTimeForDatabase(input.cancelled_at),
      formatDateTimeForDatabase(input.expired_at),
      formatDateTimeForDatabase(input.blocked_at),
      formatDateTimeForDatabase(input.reactivated_at),
      formatDateTimeForDatabase(input.last_payment_at),
      formatDateTimeForDatabase(input.last_status_change_at),
      input.notes ?? null,
      input.metadata_text ?? null,
    ],
  );

  const rows = await dbQuery(
    connection,
    "SELECT * FROM organization_subscriptions WHERE organization_id = ? LIMIT 1",
    [input.organization_id],
  );
  return mapSubscription(rows[0]);
}

export async function updateOrganizationSubscription(subscriptionId, input, connection = null) {
  const statement = buildUpdateStatement({
    plan_id: input.plan_id,
    gateway: input.gateway,
    gateway_customer_id: input.gateway_customer_id,
    gateway_subscription_id: input.gateway_subscription_id,
    status: input.status ? normalizeBillingStatus(input.status) : undefined,
    billing_cycle: input.billing_cycle ? normalizeBillingCycle(input.billing_cycle) : undefined,
    amount_cents: input.amount_cents === undefined ? undefined : Number(input.amount_cents),
    currency: input.currency,
    trial_starts_at: input.trial_starts_at === undefined ? undefined : formatDateTimeForDatabase(input.trial_starts_at),
    trial_ends_at: input.trial_ends_at === undefined ? undefined : formatDateTimeForDatabase(input.trial_ends_at),
    current_period_start:
      input.current_period_start === undefined ? undefined : formatDateTimeForDatabase(input.current_period_start),
    current_period_end:
      input.current_period_end === undefined ? undefined : formatDateTimeForDatabase(input.current_period_end),
    next_due_date: input.next_due_date === undefined ? undefined : formatDateForDatabase(input.next_due_date),
    grace_until: input.grace_until === undefined ? undefined : formatDateTimeForDatabase(input.grace_until),
    cancel_at_period_end:
      input.cancel_at_period_end === undefined ? undefined : input.cancel_at_period_end ? 1 : 0,
    cancelled_at: input.cancelled_at === undefined ? undefined : formatDateTimeForDatabase(input.cancelled_at),
    expired_at: input.expired_at === undefined ? undefined : formatDateTimeForDatabase(input.expired_at),
    blocked_at: input.blocked_at === undefined ? undefined : formatDateTimeForDatabase(input.blocked_at),
    reactivated_at:
      input.reactivated_at === undefined ? undefined : formatDateTimeForDatabase(input.reactivated_at),
    last_payment_at:
      input.last_payment_at === undefined ? undefined : formatDateTimeForDatabase(input.last_payment_at),
    last_status_change_at:
      input.last_status_change_at === undefined
        ? undefined
        : formatDateTimeForDatabase(input.last_status_change_at),
    notes: input.notes,
    metadata_text: input.metadata_text,
  });

  if (!statement) {
    return null;
  }

  await dbExecute(
    connection,
    `UPDATE organization_subscriptions SET ${statement.sql} WHERE id = ?`,
    [...statement.params, subscriptionId],
  );

  const rows = await dbQuery(
    connection,
    "SELECT * FROM organization_subscriptions WHERE id = ? LIMIT 1",
    [subscriptionId],
  );

  return mapSubscription(rows[0]);
}

export async function getOrganizationAccessLock(organizationId) {
  const rows = await query(
    "SELECT * FROM organization_access_locks WHERE organization_id = ? LIMIT 1",
    [organizationId],
  );

  return mapAccessLock(rows[0]);
}

export async function upsertOrganizationAccessLock(organizationId, input, connection = null) {
  const rows = await dbQuery(
    connection,
    "SELECT * FROM organization_access_locks WHERE organization_id = ? LIMIT 1",
    [organizationId],
  );
  const existing = mapAccessLock(rows[0]);

  if (!existing) {
    const id = randomUUID();
    await dbExecute(
      connection,
      `INSERT INTO organization_access_locks (
        id, organization_id, is_locked, lock_reason, locked_at, unlocked_at, grace_until,
        related_subscription_id, related_transaction_id, notes, metadata_text
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        organizationId,
        input.is_locked ? 1 : 0,
        input.lock_reason ?? null,
        formatDateTimeForDatabase(input.locked_at),
        formatDateTimeForDatabase(input.unlocked_at),
        formatDateTimeForDatabase(input.grace_until),
        input.related_subscription_id ?? null,
        input.related_transaction_id ?? null,
        input.notes ?? null,
        input.metadata_text ?? null,
      ],
    );

    const nextRows = await dbQuery(
      connection,
      "SELECT * FROM organization_access_locks WHERE organization_id = ? LIMIT 1",
      [organizationId],
    );
    return mapAccessLock(nextRows[0]);
  }

  const statement = buildUpdateStatement({
    is_locked: input.is_locked === undefined ? undefined : input.is_locked ? 1 : 0,
    lock_reason: input.lock_reason,
    locked_at: input.locked_at === undefined ? undefined : formatDateTimeForDatabase(input.locked_at),
    unlocked_at: input.unlocked_at === undefined ? undefined : formatDateTimeForDatabase(input.unlocked_at),
    grace_until: input.grace_until === undefined ? undefined : formatDateTimeForDatabase(input.grace_until),
    related_subscription_id: input.related_subscription_id,
    related_transaction_id: input.related_transaction_id,
    notes: input.notes,
    metadata_text: input.metadata_text,
  });

  if (!statement) {
    return existing;
  }

  await dbExecute(
    connection,
    `UPDATE organization_access_locks SET ${statement.sql} WHERE organization_id = ?`,
    [...statement.params, organizationId],
  );

  const nextRows = await dbQuery(
    connection,
    "SELECT * FROM organization_access_locks WHERE organization_id = ? LIMIT 1",
    [organizationId],
  );
  return mapAccessLock(nextRows[0]);
}

export async function createOrUpdateBillingTransaction(input, connection = null) {
  const existingRows = input.gateway_payment_id
    ? await dbQuery(
        connection,
        "SELECT * FROM billing_transactions WHERE gateway_payment_id = ? LIMIT 1",
        [input.gateway_payment_id],
      )
    : [];
  const existing = mapTransaction(existingRows[0]);

  if (!existing) {
    const id = input.id ?? randomUUID();
    await dbExecute(
      connection,
      `INSERT INTO billing_transactions (
        id, organization_id, subscription_id, plan_id, gateway, gateway_payment_id,
        gateway_invoice_id, gateway_charge_id, gateway_event_reference, transaction_type,
        payment_method, status, description, amount_cents, net_amount_cents, fee_cents,
        currency, installment_count, due_date, paid_at, confirmed_at, overdue_at, refunded_at,
        cancelled_at, invoice_url, bank_slip_url, pix_qr_code_text, pix_qr_code_image_url,
        card_brand, card_last4, external_reference, notes, metadata_text
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        input.organization_id,
        input.subscription_id,
        input.plan_id,
        input.gateway ?? DEFAULT_GATEWAY,
        input.gateway_payment_id ?? null,
        input.gateway_invoice_id ?? null,
        input.gateway_charge_id ?? null,
        input.gateway_event_reference ?? null,
        input.transaction_type ?? "subscription",
        normalizePaymentMethod(input.payment_method),
        normalizeBillingTransactionStatus(input.status),
        input.description ?? null,
        Number(input.amount_cents ?? 0),
        input.net_amount_cents === undefined ? null : Number(input.net_amount_cents),
        input.fee_cents === undefined ? null : Number(input.fee_cents),
        input.currency ?? DEFAULT_CURRENCY,
        Number(input.installment_count ?? 1),
        formatDateForDatabase(input.due_date),
        formatDateTimeForDatabase(input.paid_at),
        formatDateTimeForDatabase(input.confirmed_at),
        formatDateTimeForDatabase(input.overdue_at),
        formatDateTimeForDatabase(input.refunded_at),
        formatDateTimeForDatabase(input.cancelled_at),
        input.invoice_url ?? null,
        input.bank_slip_url ?? null,
        input.pix_qr_code_text ?? null,
        input.pix_qr_code_image_url ?? null,
        input.card_brand ?? null,
        input.card_last4 ?? null,
        input.external_reference ?? null,
        input.notes ?? null,
        input.metadata_text ?? null,
      ],
    );

    const rows = await dbQuery(connection, "SELECT * FROM billing_transactions WHERE id = ? LIMIT 1", [id]);
    return mapTransaction(rows[0]);
  }

  const statement = buildUpdateStatement({
    organization_id: input.organization_id,
    subscription_id: input.subscription_id,
    plan_id: input.plan_id,
    gateway: input.gateway,
    gateway_invoice_id: input.gateway_invoice_id,
    gateway_charge_id: input.gateway_charge_id,
    gateway_event_reference: input.gateway_event_reference,
    transaction_type: input.transaction_type,
    payment_method: input.payment_method ? normalizePaymentMethod(input.payment_method) : undefined,
    status: input.status ? normalizeBillingTransactionStatus(input.status) : undefined,
    description: input.description,
    amount_cents: input.amount_cents === undefined ? undefined : Number(input.amount_cents),
    net_amount_cents: input.net_amount_cents === undefined ? undefined : Number(input.net_amount_cents),
    fee_cents: input.fee_cents === undefined ? undefined : Number(input.fee_cents),
    currency: input.currency,
    installment_count:
      input.installment_count === undefined ? undefined : Number(input.installment_count),
    due_date: input.due_date === undefined ? undefined : formatDateForDatabase(input.due_date),
    paid_at: input.paid_at === undefined ? undefined : formatDateTimeForDatabase(input.paid_at),
    confirmed_at:
      input.confirmed_at === undefined ? undefined : formatDateTimeForDatabase(input.confirmed_at),
    overdue_at: input.overdue_at === undefined ? undefined : formatDateTimeForDatabase(input.overdue_at),
    refunded_at:
      input.refunded_at === undefined ? undefined : formatDateTimeForDatabase(input.refunded_at),
    cancelled_at:
      input.cancelled_at === undefined ? undefined : formatDateTimeForDatabase(input.cancelled_at),
    invoice_url: input.invoice_url,
    bank_slip_url: input.bank_slip_url,
    pix_qr_code_text: input.pix_qr_code_text,
    pix_qr_code_image_url: input.pix_qr_code_image_url,
    card_brand: input.card_brand,
    card_last4: input.card_last4,
    external_reference: input.external_reference,
    notes: input.notes,
    metadata_text: input.metadata_text,
  });

  if (!statement) {
    return existing;
  }

  await dbExecute(
    connection,
    `UPDATE billing_transactions SET ${statement.sql} WHERE id = ?`,
    [...statement.params, existing.id],
  );

  const rows = await dbQuery(connection, "SELECT * FROM billing_transactions WHERE id = ? LIMIT 1", [
    existing.id,
  ]);
  return mapTransaction(rows[0]);
}

export async function findBillingTransactionByGatewayPaymentId(gatewayPaymentId) {
  const rows = await query(
    "SELECT * FROM billing_transactions WHERE gateway_payment_id = ? LIMIT 1",
    [gatewayPaymentId],
  );

  return mapTransaction(rows[0]);
}

export async function getCurrentBillingTransactionBySubscriptionId(subscriptionId) {
  const rows = await query(
    `SELECT * FROM billing_transactions
      WHERE subscription_id = ?
      ORDER BY
        CASE WHEN status IN ('pending', 'overdue') THEN 0 ELSE 1 END,
        COALESCE(due_date, DATE(created_at)) ASC,
        created_at DESC
      LIMIT 1`,
    [subscriptionId],
  );

  return mapTransaction(rows[0]);
}

export async function listBillingTransactionsByOrganizationId(organizationId) {
  const rows = await query(
    `SELECT * FROM billing_transactions
      WHERE organization_id = ?
      ORDER BY COALESCE(due_date, DATE(created_at)) DESC, created_at DESC`,
    [organizationId],
  );

  return rows.map(mapTransaction);
}

export async function createWebhookEventLog(input, connection = null) {
  const id = input.id ?? randomUUID();

  try {
    await dbExecute(
      connection,
      `INSERT INTO webhook_events (
        id, gateway, event_id, event_type, organization_id, subscription_id, billing_transaction_id,
        webhook_token_received, signature_valid, payload_text, processed, processed_at,
        processing_attempts, processing_error, received_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [
        id,
        input.gateway ?? DEFAULT_GATEWAY,
        input.event_id,
        input.event_type,
        input.organization_id ?? null,
        input.subscription_id ?? null,
        input.billing_transaction_id ?? null,
        input.webhook_token_received ?? null,
        input.signature_valid ? 1 : 0,
        input.payload_text,
        input.processed ? 1 : 0,
        formatDateTimeForDatabase(input.processed_at),
        Number(input.processing_attempts ?? 0),
        input.processing_error ?? null,
      ],
    );
  } catch (error) {
    if (error?.code === "ER_DUP_ENTRY") {
      const rows = await dbQuery(
        connection,
        "SELECT * FROM webhook_events WHERE gateway = ? AND event_id = ? LIMIT 1",
        [input.gateway ?? DEFAULT_GATEWAY, input.event_id],
      );

      return {
        duplicate: true,
        event: mapWebhookEvent(rows[0]),
      };
    }

    throw error;
  }

  const rows = await dbQuery(connection, "SELECT * FROM webhook_events WHERE id = ? LIMIT 1", [id]);
  return {
    duplicate: false,
    event: mapWebhookEvent(rows[0]),
  };
}

export async function updateWebhookEventLog(eventId, input, connection = null) {
  const statement = buildUpdateStatement({
    organization_id: input.organization_id,
    subscription_id: input.subscription_id,
    billing_transaction_id: input.billing_transaction_id,
    signature_valid: input.signature_valid === undefined ? undefined : input.signature_valid ? 1 : 0,
    processed: input.processed === undefined ? undefined : input.processed ? 1 : 0,
    processed_at: input.processed_at === undefined ? undefined : formatDateTimeForDatabase(input.processed_at),
    processing_attempts:
      input.processing_attempts === undefined ? undefined : Number(input.processing_attempts),
    processing_error: input.processing_error,
  });

  if (!statement) {
    return null;
  }

  await dbExecute(
    connection,
    `UPDATE webhook_events SET ${statement.sql} WHERE id = ?`,
    [...statement.params, eventId],
  );

  const rows = await dbQuery(connection, "SELECT * FROM webhook_events WHERE id = ? LIMIT 1", [eventId]);
  return mapWebhookEvent(rows[0]);
}

export async function updateOrganizationBillingCache(organizationId, input, connection = null) {
  const snapshot = {
    monthly_amount:
      input.monthly_amount_cents === undefined ? undefined : Number(input.monthly_amount_cents) / 100,
    subscription_status:
      input.subscription_status === undefined
        ? undefined
        : mapLegacySubscriptionStatus({ subscription_status: input.subscription_status }),
    subscription_plan: input.subscription_plan,
    due_date: input.due_date === undefined ? undefined : formatDateForDatabase(input.due_date),
    trial_end: input.trial_end === undefined ? undefined : formatDateForDatabase(input.trial_end),
  };
  const statement = buildUpdateStatement(snapshot);

  if (!statement) {
    return null;
  }

  await dbExecute(
    connection,
    `UPDATE organizations SET ${statement.sql} WHERE id = ?`,
    [...statement.params, organizationId],
  );

  const rows = await dbQuery(
    connection,
    "SELECT id, subscription_status, subscription_plan, due_date, trial_end, monthly_amount FROM organizations WHERE id = ? LIMIT 1",
    [organizationId],
  );

  return rows[0] ?? null;
}

export async function getOrganizationBillingAggregate(organizationId) {
  const organization = await getBillingOrganizationSummary(organizationId);
  const subscription = await getOrganizationSubscriptionByOrganizationId(organizationId);
  const accessLock = await getOrganizationAccessLock(organizationId);
  const currentTransaction = subscription
    ? await getCurrentBillingTransactionBySubscriptionId(subscription.id)
    : null;
  const plan = subscription ? await getSubscriptionPlanById(subscription.plan_id) : await getSubscriptionPlanByCode();

  return {
    organization,
    plan,
    subscription,
    currentTransaction,
    accessLock,
  };
}

export async function runBillingTransaction(callback) {
  return withTransaction(callback);
}
