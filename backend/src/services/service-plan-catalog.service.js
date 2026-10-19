import { randomUUID } from "node:crypto";
import { execute, query, withTransaction } from "../lib/database.js";
import { getServiceByIdForOrganization } from "../lib/data.js";

function fail(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

export async function ensureServicePlanCatalog() {
  await execute(`CREATE TABLE IF NOT EXISTS service_plans (
    id CHAR(36) NOT NULL PRIMARY KEY, organization_id CHAR(36) NOT NULL,
    name VARCHAR(160) NOT NULL, description TEXT NULL, price_cents INT UNSIGNED NOT NULL,
    duration_months TINYINT UNSIGNED NOT NULL, active TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    KEY idx_service_plans_org (organization_id, active)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
  await execute(`CREATE TABLE IF NOT EXISTS service_plan_services (
    organization_id CHAR(36) NOT NULL, plan_id CHAR(36) NOT NULL, service_id CHAR(36) NOT NULL,
    position INT UNSIGNED NOT NULL DEFAULT 0,
    PRIMARY KEY (organization_id, plan_id, service_id), KEY idx_plan_services_plan (plan_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
  await execute(`CREATE TABLE IF NOT EXISTS service_plan_memberships (
    id CHAR(36) NOT NULL PRIMARY KEY, organization_id CHAR(36) NOT NULL,
    plan_id CHAR(36) NOT NULL, client_id CHAR(36) NOT NULL, professional_id CHAR(36) NULL,
    plan_name VARCHAR(160) NOT NULL, service_ids TEXT NOT NULL, duration_months TINYINT UNSIGNED NOT NULL,
    price_cents INT UNSIGNED NOT NULL, anchor_date DATE NOT NULL, end_date DATE NOT NULL,
    start_time TIME NOT NULL, created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    KEY idx_plan_memberships_org_end (organization_id, end_date), KEY idx_plan_memberships_client (organization_id, client_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
  await execute(`CREATE TABLE IF NOT EXISTS service_plan_periods (
    id CHAR(36) NOT NULL PRIMARY KEY, organization_id CHAR(36) NOT NULL, membership_id CHAR(36) NOT NULL,
    start_date DATE NOT NULL, end_date DATE NOT NULL, amount_cents INT UNSIGNED NOT NULL,
    paid_at DATETIME NOT NULL, UNIQUE KEY idx_plan_period_unique (organization_id, membership_id, start_date),
    KEY idx_plan_period_paid (organization_id, paid_at)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
  await execute(`CREATE TABLE IF NOT EXISTS service_plan_appointments (
    organization_id CHAR(36) NOT NULL, membership_id CHAR(36) NOT NULL,
    period_id CHAR(36) NOT NULL, appointment_id CHAR(36) NOT NULL,
    PRIMARY KEY (organization_id, appointment_id), KEY idx_plan_appointments_membership (organization_id, membership_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
  await execute(`CREATE TABLE IF NOT EXISTS service_plan_reminders (
    organization_id CHAR(36) NOT NULL, period_id CHAR(36) NOT NULL,
    status VARCHAR(20) NOT NULL, error_message TEXT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (organization_id, period_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
}

export async function listServicePlans(organizationId) {
  const [plans, services] = await Promise.all([
    query("SELECT * FROM service_plans WHERE organization_id = ? ORDER BY active DESC, name ASC", [organizationId]),
    query("SELECT plan_id, service_id FROM service_plan_services WHERE organization_id = ? ORDER BY position", [organizationId]),
  ]);
  return plans.map((plan) => ({ id: plan.id, name: plan.name, description: plan.description || "", priceCents: Number(plan.price_cents), durationMonths: Number(plan.duration_months), active: Boolean(plan.active), serviceIds: services.filter((item) => item.plan_id === plan.id).map((item) => item.service_id) }));
}

export async function saveServicePlan(organizationId, input, planId = null) {
  const name = String(input.name ?? "").trim();
  const description = String(input.description ?? "").trim();
  const priceCents = Number(input.priceCents);
  const durationMonths = Number(input.durationMonths);
  const serviceIds = Array.isArray(input.serviceIds) ? [...new Set(input.serviceIds)] : [];
  if (!name || name.length > 160) throw fail("Informe o nome do plano (ate 160 caracteres).");
  if (!Number.isSafeInteger(priceCents) || priceCents <= 0 || priceCents > 4294967295) throw fail("Informe um valor valido para o plano.");
  if (![1, 2, 6, 12].includes(durationMonths)) throw fail("Duracao invalida para o plano.");
  if (!serviceIds.length || serviceIds.some((id) => typeof id !== "string" || !id.trim())) throw fail("Selecione pelo menos um servico.");
  for (const serviceId of serviceIds) if (!(await getServiceByIdForOrganization(organizationId, serviceId))) throw fail("Servico nao encontrado.");
  const id = planId || randomUUID();
  await withTransaction(async (connection) => {
    if (planId) {
      const [result] = await connection.execute("UPDATE service_plans SET name = ?, description = ?, price_cents = ?, duration_months = ?, active = ? WHERE organization_id = ? AND id = ?", [name, description || null, priceCents, durationMonths, input.active === false ? 0 : 1, organizationId, id]);
      if (!result.affectedRows) throw fail("Plano nao encontrado.", 404);
      await connection.execute("DELETE FROM service_plan_services WHERE organization_id = ? AND plan_id = ?", [organizationId, id]);
    } else {
      await connection.execute("INSERT INTO service_plans (id, organization_id, name, description, price_cents, duration_months, active) VALUES (?, ?, ?, ?, ?, ?, ?)", [id, organizationId, name, description || null, priceCents, durationMonths, input.active === false ? 0 : 1]);
    }
    for (const [position, serviceId] of serviceIds.entries()) await connection.execute("INSERT INTO service_plan_services (organization_id, plan_id, service_id, position) VALUES (?, ?, ?, ?)", [organizationId, id, serviceId, position]);
  });
  return (await listServicePlans(organizationId)).find((plan) => plan.id === id);
}
