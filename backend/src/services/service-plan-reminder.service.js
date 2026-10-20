import { execute, query } from "../lib/database.js";
import { getAppSettingsByOrganization } from "../lib/data.js";
import { getWhatsappStatus, sendWhatsappMessage } from "./whatsapp.service.js";

export async function processPlanExpiryReminders() {
  const upcoming = await query(`SELECT m.organization_id, m.id, m.plan_name, m.end_date, p.id AS period_id,
      c.nome AS client_name, c.telefone
    FROM service_plan_memberships m
    JOIN service_plan_periods p ON p.organization_id = m.organization_id AND p.membership_id = m.id AND p.end_date = m.end_date
    JOIN clients c ON c.organization_id = m.organization_id AND c.id = m.client_id
    WHERE m.end_date >= CURDATE() AND m.end_date <= DATE_ADD(CURDATE(), INTERVAL 3 DAY)`);
  for (const item of upcoming) {
    const daysBefore = Math.round((new Date(`${item.end_date}T12:00:00Z`).getTime() - new Date(`${new Date().toISOString().slice(0, 10)}T12:00:00Z`).getTime()) / 86_400_000);
    if (![0, 1, 2, 3].includes(daysBefore)) continue;
    const [settings, whatsapp] = await Promise.all([getAppSettingsByOrganization(item.organization_id), getWhatsappStatus({ organizationId: item.organization_id })]);
    if (!whatsapp.ativo || !whatsapp.configurado || !settings?.recurring_chave_pix_padrao || !item.telefone) continue;
    let claim = await execute("INSERT IGNORE INTO service_plan_reminders (organization_id, period_id, reminder_days_before, status) VALUES (?, ?, ?, 'enviando')", [item.organization_id, item.period_id, daysBefore]);
    if (!claim.affectedRows) claim = await execute("UPDATE service_plan_reminders SET status = 'enviando', error_message = NULL WHERE organization_id = ? AND period_id = ? AND reminder_days_before = ? AND status = 'falha' AND created_at <= DATE_SUB(NOW(), INTERVAL 5 MINUTE)", [item.organization_id, item.period_id, daysBefore]);
    if (!claim.affectedRows) continue;
    let deliveryStarted = false;
    let delivered = false;
    try {
      const current = await query("SELECT id FROM service_plan_memberships WHERE organization_id = ? AND id = ? AND end_date = ?", [item.organization_id, item.id, item.end_date]);
      if (!current.length) {
        await execute("UPDATE service_plan_reminders SET status = 'cancelado' WHERE organization_id = ? AND period_id = ? AND reminder_days_before = ?", [item.organization_id, item.period_id, daysBefore]);
        continue;
      }
      const due = item.end_date.split("-").reverse().join("/");
      const message = `Ola ${item.client_name}, seu plano ${item.plan_name} vence em ${due}. O vencimento esta proximo. Para renovar, utilize a chave Pix: ${settings.recurring_chave_pix_padrao}. Caso ja tenha realizado o pagamento, desconsidere este aviso.`;
      deliveryStarted = true;
      await sendWhatsappMessage({ organizationId: item.organization_id, phone: item.telefone, message });
      delivered = true;
      await execute("UPDATE service_plan_reminders SET status = 'enviado' WHERE organization_id = ? AND period_id = ? AND reminder_days_before = ?", [item.organization_id, item.period_id, daysBefore]);
    } catch (error) {
      const uncertain = delivered || (deliveryStarted && error.deliveryUncertain);
      await execute("UPDATE service_plan_reminders SET status = ?, error_message = ?, created_at = CURRENT_TIMESTAMP WHERE organization_id = ? AND period_id = ? AND reminder_days_before = ?", [uncertain ? 'incerto' : 'falha', String(error.message ?? error).slice(0, 1000), item.organization_id, item.period_id, daysBefore]);
    }
  }
}
