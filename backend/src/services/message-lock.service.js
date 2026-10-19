import { createHash } from "node:crypto";
import { execute, getPool, query } from "../lib/database.js";

export async function ensureMessageGuards() {
  await execute(`CREATE TABLE IF NOT EXISTS whatsapp_delivery_guards (
    organization_id CHAR(36) NOT NULL, kind VARCHAR(24) NOT NULL, item_id CHAR(36) NOT NULL,
    status VARCHAR(20) NOT NULL, last_error TEXT NULL,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (organization_id, kind, item_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
}

// An interrupted or uncertain delivery must be reviewed, not automatically resent.
export async function beginMessageDelivery(organizationId, kind, itemId, { allowResend = false } = {}) {
  const rows = await query("SELECT status, updated_at <= DATE_SUB(NOW(), INTERVAL 5 MINUTE) AS retry_allowed FROM whatsapp_delivery_guards WHERE organization_id = ? AND kind = ? AND item_id = ?", [organizationId, kind, itemId]);
  const status = rows[0]?.status;
  if (status === "enviando" || status === "incerto") {
    const error = new Error("O envio anterior precisa ser verificado antes de uma nova tentativa para evitar mensagens duplicadas.");
    error.statusCode = 409;
    throw error;
  }
  if (status === "enviado" && !allowResend) return false;
  if (status === "falha" && !allowResend && !rows[0].retry_allowed) return false;
  await execute(`INSERT INTO whatsapp_delivery_guards (organization_id, kind, item_id, status, last_error)
    VALUES (?, ?, ?, 'enviando', NULL) ON DUPLICATE KEY UPDATE status = 'enviando', last_error = NULL`, [organizationId, kind, itemId]);
  return true;
}

export async function finishMessageDelivery(organizationId, kind, itemId, status, error = null) {
  await execute("UPDATE whatsapp_delivery_guards SET status = ?, last_error = ? WHERE organization_id = ? AND kind = ? AND item_id = ?", [status, error ? String(error).slice(0, 1000) : null, organizationId, kind, itemId]);
}

// MySQL releases named locks when a connection closes, including on process failure.
export async function withMessageLock(kind, organizationId, itemId, callback) {
  const key = `apmsg:${createHash("sha256").update(`${kind}:${organizationId}:${itemId}`).digest("hex").slice(0, 48)}`;
  const pool = await getPool();
  const connection = await pool.getConnection();
  let locked = false;
  let destroyed = false;
  try {
    const [rows] = await connection.execute("SELECT GET_LOCK(?, 0) AS acquired", [key]);
    locked = Number(rows[0]?.acquired) === 1;
    if (!locked) {
      const error = new Error("Ja existe um envio em andamento. Aguarde e tente novamente.");
      error.statusCode = 409;
      throw error;
    }
    return await callback();
  } finally {
    if (locked) {
      try { await connection.execute("SELECT RELEASE_LOCK(?)", [key]); }
      catch { connection.destroy(); destroyed = true; }
    }
    if (!destroyed) connection.release();
  }
}
