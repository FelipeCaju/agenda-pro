import { execute, query } from "../lib/database.js";
import { getAppSettingsByOrganization } from "../lib/data.js";
import { getWhatsappStatus, sendWhatsappMessage } from "./whatsapp.service.js";

export async function processPlanExpiryReminders() {
  const upcoming = await query(`SELECT m.organization_id, m.id, m.plan_name, m.end_date, p.id AS period_id,
      c.nome AS client_name, c.telefone
    FROM service_plan_memberships m
    JOIN service_plan_periods p ON p.organization_id = m.organization_id AND p.membership_id = m.id AND p.end_date = m.end_date
    JOIN clients c ON c.organization_id = m.organization_id AND c.id = m.client_id
    LEFT JOIN service_plan_reminders r ON r.organization_id = p.organization_id AND r.period_id = p.id
    WHERE m.end_date >= CURDATE() AND m.end_date <= DATE_ADD(CURDATE(), INTERVAL 7 DAY)
      AND (r.period_id IS NULL OR (r.status = 'falha' AND r.created_at <= DATE_SUB(NOW(), INTERVAL 5 MINUTE)))`);
  for (const item of upcoming) {
    const [settings, whatsapp] = await Promise.all([getAppSettingsByOrganization(item.organization_id), getWhatsappStatus({ organizationId: item.organization_id })]);
    if (!whatsapp.ativo || !whatsapp.configurado || !settings?.recurring_chave_pix_padrao || !item.telefone) continue;
    let claim = await execute("INSERT IGNORE INTO service_plan_reminders (organization_id, period_id, status) VALUES (?, ?, 'enviando')", [item.organization_id, item.period_id]);
    if (!claim.affectedRows) claim = await execute("UPDATE service_plan_reminders SET status = 'enviando', error_message = NULL WHERE organization_id = ? AND period_id = ? AND status = 'falha' AND created_at <= DATE_SUB(NOW(), INTERVAL 5 MINUTE)", [item.organization_id, item.period_id]);
    if (!claim.affectedRows) continue;
    let deliveryStarted = false;
    let delivered = false;
    try {
      const current = await query("SELECT id FROM service_plan_memberships WHERE organization_id = ? AND id = ? AND end_date = ?", [item.organization_id, item.id, item.end_date]);
      if (!current.length) {
        await execute("UPDATE service_plan_reminders SET status = 'cancelado' WHERE organization_id = ? AND period_id = ?", [item.organization_id, item.period_id]);
        continue;
      }
      const due = item.end_date.split("-").reverse().join("/");
      const message = `Ola ${item.client_name}, seu plano ${item.plan_name} vence em ${due}. Para renovar, entre em contato. Chave Pix: ${settings.recurring_chave_pix_padrao}.`;
      deliveryStarted = true;
      await sendWhatsappMessage({ organizationId: item.organization_id, phone: item.telefone, message });
      delivered = true;
      await execute("UPDATE service_plan_reminders SET status = 'enviado' WHERE organization_id = ? AND period_id = ?", [item.organization_id, item.period_id]);
    } catch (error) {
      const uncertain = delivered || (deliveryStarted && error.deliveryUncertain);
      await execute("UPDATE service_plan_reminders SET status = ?, error_message = ?, created_at = CURRENT_TIMESTAMP WHERE organization_id = ? AND period_id = ?", [uncertain ? 'incerto' : 'falha', String(error.message ?? error).slice(0, 1000), item.organization_id, item.period_id]);
    }
  }
}
