import { randomUUID } from "node:crypto";
import { query, withTransaction } from "../lib/database.js";
import { getAppSettingsByOrganization, insertAppointmentInTransaction } from "../lib/data.js";
import { buildServicePlanPeriod } from "../lib/service-plan-period.js";
import { validatePlanAppointmentDates } from "./appointment.service.js";
import { listServicePlans } from "./service-plan-catalog.service.js";

function fail(message, statusCode = 400) {
  return Object.assign(new Error(message), { statusCode });
}

export async function listPlanMemberships(organizationId) {
  return query(`SELECT m.id, m.plan_id AS planId, m.client_id AS clientId, m.plan_name AS planName,
    m.price_cents AS priceCents, m.duration_months AS durationMonths, m.appointment_mode AS appointmentMode, m.appointment_count AS appointmentCount, m.anchor_date AS anchorDate,
    m.end_date AS endDate, m.start_time AS startTime, c.nome AS clientName, r.status AS reminderStatus, r.error_message AS reminderError
    FROM service_plan_memberships m JOIN clients c ON c.organization_id = m.organization_id AND c.id = m.client_id
    LEFT JOIN service_plan_periods p ON p.organization_id = m.organization_id AND p.membership_id = m.id AND p.end_date = m.end_date
    LEFT JOIN service_plan_reminders r ON r.organization_id = p.organization_id AND r.period_id = p.id AND r.reminder_days_before = 0
    WHERE m.organization_id = ? ORDER BY m.end_date, c.nome`, [organizationId]);
}

export async function getPlanDashboard(organizationId, filters = {}) {
  const [memberships, periods] = await Promise.all([
    query(`SELECT m.id, m.plan_id AS planId, m.client_id AS clientId, m.plan_name AS planName,
      m.end_date AS endDate, m.service_ids AS serviceIds, c.nome AS clientName
      FROM service_plan_memberships m JOIN clients c ON c.organization_id = m.organization_id AND c.id = m.client_id
      WHERE m.organization_id = ? ORDER BY m.end_date, c.nome`, [organizationId]),
    query(`SELECT p.amount_cents AS amountCents, DATE(p.paid_at) AS paidDate, m.id AS membershipId
      FROM service_plan_periods p JOIN service_plan_memberships m ON m.organization_id = p.organization_id AND m.id = p.membership_id
      WHERE p.organization_id = ?`, [organizationId]),
  ]);
  const filtered = memberships.filter((m) => (!filters.planId || m.planId === filters.planId) &&
    (!filters.clientId || m.clientId === filters.clientId) &&
    (!filters.serviceId || JSON.parse(m.serviceIds).includes(filters.serviceId)));
  const included = new Set(filtered.map((m) => m.id));
  const paidCents = periods.filter((p) => included.has(p.membershipId) && (!filters.startDate || p.paidDate >= filters.startDate) && (!filters.endDate || p.paidDate <= filters.endDate)).reduce((total, p) => total + Number(p.amountCents), 0);
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });
  const limit = new Date(`${today}T12:00:00Z`); limit.setUTCDate(limit.getUTCDate() + 7);
  return { paidCents, memberships: filtered.map(({ serviceIds, ...m }) => m), upcoming: filtered.filter((m) => m.endDate >= today && m.endDate <= limit.toISOString().slice(0, 10)).map(({ serviceIds, ...m }) => m) };
}

async function getMembership(organizationId, id) {
  const rows = await query("SELECT * FROM service_plan_memberships WHERE organization_id = ? AND id = ?", [organizationId, id]);
  if (!rows.length) throw fail("Vinculo nao encontrado.", 404);
  return rows[0];
}

async function prepare(organizationId, input, membershipId) {
  let plan;
  let clientId;
  let professionalId;
  let startTime;
  let startDate;
  let anchorDate;
  if (membershipId) {
    const membership = await getMembership(organizationId, membershipId);
    plan = { id: membership.plan_id, name: membership.plan_name, priceCents: Number(membership.price_cents), durationMonths: Number(membership.duration_months), appointmentMode: membership.appointment_mode === "quantity" ? "quantity" : "weekly", appointmentCount: membership.appointment_count === null ? null : Number(membership.appointment_count), serviceIds: JSON.parse(membership.service_ids) };
    clientId = membership.client_id;
    professionalId = membership.professional_id;
    startTime = String(membership.start_time).slice(0, 5);
    startDate = membership.end_date;
    anchorDate = membership.anchor_date;
  } else {
    plan = (await listServicePlans(organizationId)).find((item) => item.id === input.planId && item.active);
    if (!plan) throw fail("Selecione um plano ativo.");
    clientId = input.clientId;
    professionalId = input.professionalId || null;
    startTime = input.startTime;
    startDate = input.startDate;
    anchorDate = startDate;
  }
  let period;
  try { period = buildServicePlanPeriod(startDate, plan.durationMonths, anchorDate, plan.appointmentMode, plan.appointmentCount); }
  catch (error) { throw fail(error.message); }
  const appointmentInput = { cliente_id: clientId, profissional_id: professionalId, horario_inicial: startTime,
    valor: 0, payment_status: "pago", status: "pendente", items: plan.serviceIds.map((id) => ({ servico_id: id, valor_unitario: 0, valor_total: 0 })) };
  const appointments = await validatePlanAppointmentDates({ organizationId, input: appointmentInput, dates: period.appointments });
  return { plan, period, appointments, clientId, professionalId: appointments[0].profissional_id, startTime, anchorDate };
}

export async function previewPlanMembership(organizationId, input, membershipId = null) {
  const prepared = await prepare(organizationId, input, membershipId);
  return { planName: prepared.plan.name, priceCents: prepared.plan.priceCents, ...prepared.period };
}

export async function savePlanMembership(organizationId, input, membershipId = null) {
  if (input.paid !== true) throw fail("Confirme que o pagamento foi recebido antes de salvar.");
  const prepared = await prepare(organizationId, input, membershipId);
  const settings = await getAppSettingsByOrganization(organizationId);
  const id = membershipId || randomUUID();
  const periodId = randomUUID();
  await withTransaction(async (connection) => {
    if (membershipId) {
      const [rows] = await connection.execute("SELECT end_date FROM service_plan_memberships WHERE organization_id = ? AND id = ? FOR UPDATE", [organizationId, id]);
      if (!rows.length || rows[0].end_date !== prepared.period.startDate) throw fail("O plano foi atualizado. Confira e tente novamente.", 409);
    }
    // Bloqueia as faixas de datas e confere novamente dentro da transacao.
    for (const appointment of prepared.appointments) {
      const [existing] = await connection.execute(`SELECT id FROM appointments WHERE organization_id = ? AND data = ? AND status <> 'cancelado'
        AND horario_inicial < ? AND horario_final > ? AND (? IS NULL OR profissional_id IS NULL OR profissional_id = ?) FOR UPDATE`,
        [organizationId, appointment.data, appointment.horario_final, appointment.horario_inicial, appointment.profissional_id, appointment.profissional_id]);
      if (!settings?.permitir_conflito && existing.length) throw fail(`Conflito de horario em ${appointment.data}.`, 409);
      const [blocked] = await connection.execute(`SELECT id FROM blocked_slots WHERE organization_id = ? AND data = ?
        AND horario_inicial < ? AND horario_final > ? AND (professional_id IS NULL OR professional_id = ?) FOR UPDATE`,
        [organizationId, appointment.data, appointment.horario_final, appointment.horario_inicial, appointment.profissional_id]);
      if (blocked.length) throw fail(`Horario bloqueado em ${appointment.data}.`, 409);
    }
    if (membershipId) {
      await connection.execute("UPDATE service_plan_memberships SET end_date = ? WHERE organization_id = ? AND id = ?", [prepared.period.endDateExclusive, organizationId, id]);
    } else {
      await connection.execute(`INSERT INTO service_plan_memberships (id, organization_id, plan_id, client_id, professional_id, plan_name, service_ids, duration_months, appointment_mode, appointment_count, price_cents, anchor_date, end_date, start_time)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [id, organizationId, prepared.plan.id, prepared.clientId, prepared.professionalId, prepared.plan.name, JSON.stringify(prepared.plan.serviceIds), prepared.plan.durationMonths, prepared.plan.appointmentMode, prepared.plan.appointmentCount, prepared.plan.priceCents, prepared.anchorDate, prepared.period.endDateExclusive, prepared.startTime]);
    }
    await connection.execute("INSERT INTO service_plan_periods (id, organization_id, membership_id, start_date, end_date, amount_cents, paid_at) VALUES (?, ?, ?, ?, ?, ?, NOW())", [periodId, organizationId, id, prepared.period.startDate, prepared.period.endDateExclusive, prepared.plan.priceCents]);
    for (const [index, appointment] of prepared.appointments.entries()) {
      const appointmentId = await insertAppointmentInTransaction(connection, organizationId, { ...appointment, recurrence_series_id: periodId, recurrence_type: "weekly", recurrence_index: index });
      await connection.execute("INSERT INTO service_plan_appointments (organization_id, membership_id, period_id, appointment_id) VALUES (?, ?, ?, ?)", [organizationId, id, periodId, appointmentId]);
    }
  });
  return { id, createdCount: prepared.appointments.length, endDate: prepared.period.endDateExclusive };
}
