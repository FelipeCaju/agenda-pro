// Verificacao isolada: cria um banco descartavel local, sem usar os dados da aplicacao.
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { readFile } from "node:fs/promises";
import mysql from "mysql2/promise";
import { loadEnvironment } from "../src/lib/env.js";

loadEnvironment();
const host = process.env.DB_HOST ?? "127.0.0.1";
if (!["127.0.0.1", "localhost", "::1"].includes(host)) throw new Error("Este teste so pode usar MySQL local.");
const database = `agendapro_test_${randomBytes(6).toString("hex")}`;
const connection = await mysql.createConnection({ host, port: Number(process.env.DB_PORT ?? 3306), user: process.env.DB_USER ?? "root", password: process.env.DB_PASSWORD ?? "", multipleStatements: true, dateStrings: true });
let created = false;
try {
  await connection.query(`CREATE DATABASE \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  created = true;
  await connection.query(`USE \`${database}\``);
  const schema = await readFile(new URL("../db/schema_current_mysql.sql", import.meta.url), "utf8");
  await connection.query(schema.slice(schema.indexOf("CREATE TABLE"), schema.indexOf("DELIMITER")));
  process.env.DB_NAME = database;
  const { initDataStore } = await import("../src/lib/data.js");
  const { ensureServicePlanCatalog, saveServicePlan } = await import("../src/services/service-plan-catalog.service.js");
  const { previewPlanMembership, savePlanMembership, listPlanMemberships, getPlanDashboard } = await import("../src/services/service-plan-membership.service.js");
  await initDataStore();
  await ensureServicePlanCatalog();
  const plan = await saveServicePlan("org-1", { name: "Plano teste", priceCents: 20000, durationMonths: 1, serviceIds: ["service-1"], active: true });
  const date = new Date(); date.setUTCDate(date.getUTCDate() + 20);
  const startDate = date.toISOString().slice(0, 10);
  const input = { planId: plan.id, clientId: "client-1", professionalId: "professional-1", startDate, startTime: "10:00" };
  const preview = await previewPlanMembership("org-1", input);
  assert.ok(preview.appointments.length >= 4);
  await connection.execute("INSERT INTO blocked_slots (id, organization_id, professional_id, data, horario_inicial, horario_final) VALUES (?, ?, ?, ?, ?, ?)", ["test-block", "org-1", "professional-1", preview.appointments[1], "10:00:00", "11:00:00"]);
  await assert.rejects(() => previewPlanMembership("org-1", input), (error) => error.statusCode === 409 && error.conflicts.some((c) => c.date === preview.appointments[1]));
  await connection.execute("DELETE FROM blocked_slots WHERE id = ? AND organization_id = ?", ["test-block", "org-1"]);
  await assert.rejects(() => savePlanMembership("org-1", { ...input, paid: false }), /pagamento/);
  assert.equal((await listPlanMemberships("org-1")).length, 0);
  await connection.query("CREATE TRIGGER fail_plan_test BEFORE INSERT ON service_plan_appointments FOR EACH ROW SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'falha simulada'");
  await assert.rejects(() => savePlanMembership("org-1", { ...input, paid: true }), /falha simulada/);
  assert.equal((await listPlanMemberships("org-1")).length, 0);
  const [rollbackRows] = await connection.query("SELECT COUNT(*) AS total FROM service_plan_periods");
  assert.equal(rollbackRows[0].total, 0);
  await connection.query("DROP TRIGGER fail_plan_test");
  const result = await savePlanMembership("org-1", { ...input, paid: true });
  assert.equal(result.createdCount, preview.appointments.length);
  const [links] = await connection.execute("SELECT appointment_id FROM service_plan_appointments WHERE organization_id = ? AND membership_id = ? LIMIT 1", ["org-1", result.id]);
  const { updateAppointmentPaymentStatus } = await import("../src/services/appointment.service.js");
  await assert.rejects(() => updateAppointmentPaymentStatus({ organizationId: "org-1", appointmentId: links[0].appointment_id, paymentStatus: "pendente" }), /plano/);
  await assert.rejects(() => previewPlanMembership("org-1", { ...input, clientId: "client-2" }), (error) => error.statusCode === 409 && error.conflicts.length > 0);
  await connection.execute("UPDATE app_settings SET permitir_conflito = 1 WHERE organization_id = ?", ["org-1"]);
  assert.ok((await previewPlanMembership("org-1", { ...input, clientId: "client-2" })).appointments.length > 0);
  await connection.execute("INSERT INTO blocked_slots (id, organization_id, professional_id, data, horario_inicial, horario_final) VALUES (?, ?, ?, ?, ?, ?)", ["test-block-allowed", "org-1", "professional-1", preview.appointments[0], "10:00:00", "11:00:00"]);
  await assert.rejects(() => previewPlanMembership("org-1", { ...input, clientId: "client-2" }), (error) => error.statusCode === 409);
  await connection.execute("DELETE FROM blocked_slots WHERE id = ? AND organization_id = ?", ["test-block-allowed", "org-1"]);
  await connection.execute("UPDATE app_settings SET permitir_conflito = 0 WHERE organization_id = ?", ["org-1"]);
  assert.equal((await listPlanMemberships("org-2")).length, 0);
  const dashboard = await getPlanDashboard("org-1", {});
  assert.equal(dashboard.paidCents, 20000);
  const renewPreview = await previewPlanMembership("org-1", {}, result.id);
  const renewal = await savePlanMembership("org-1", { paid: true }, result.id);
  assert.equal(renewal.createdCount, renewPreview.appointments.length);
  assert.equal((await getPlanDashboard("org-1", {})).paidCents, 40000);
  console.log("Fluxo isolado OK: conflitos, bloqueios, pagamento, rollback, agendamentos, renovacao, valores e isolamento por empresa.");
} finally {
  if (process.env.DB_NAME === database) {
    const { getPool } = await import("../src/lib/database.js");
    await (await getPool()).end();
  }
  if (created) await connection.query(`DROP DATABASE \`${database}\``);
  await connection.end();
}
