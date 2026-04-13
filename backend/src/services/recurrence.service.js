import { randomUUID } from "node:crypto";
import { execute, query, withTransaction } from "../lib/database.js";
import {
  getAppSettingsByOrganization,
  getClientByIdForOrganization,
  getOrganizationById,
  getServiceByIdForOrganization,
  listOrganizations,
} from "../lib/data.js";
import { sendWhatsappMessage } from "./whatsapp.service.js";

const DEFAULT_RECURRING_WHATSAPP_TEMPLATE =
  "Oie {NOME_CLIENTE}!\n\nAqui e a equipe da {EMPRESA_NOME}.\n\nPassando para te lembrar da sua cobranca de {NOME_SERVICO}.\n\nValor: R$ {VALOR}\nVencimento: {DATA_VENCIMENTO}\nChave Pix: {CHAVE_PIX}\n\nSe o pagamento ja foi realizado, pode desconsiderar esta mensagem.\nObrigada!";

function buildError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function normalizeString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeBoolean(value) {
  return Boolean(value);
}

function normalizeMoney(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Number(parsed.toFixed(2)) : Number.NaN;
}

function isValidDate(value) {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function normalizeDay(value) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const parsed = Number(value);
  return Number.isInteger(parsed) ? parsed : Number.NaN;
}

function formatMoneyBR(value) {
  return Number(value ?? 0).toFixed(2).replace(".", ",");
}

function formatDateBR(date) {
  if (!isValidDate(date)) {
    return date ?? "";
  }

  const [year, month, day] = date.split("-");
  return `${day}/${month}/${year}`;
}

function getLastDayOfMonth(year, month) {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function resolveBillingDateForMonth(year, month, billingDay) {
  const day = Math.min(Math.max(Number(billingDay), 1), getLastDayOfMonth(year, month));
  return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function getCompetencia(date) {
  return String(date ?? "").slice(0, 7);
}

function parseDateParts(date) {
  const [year, month] = String(date).split("-").map(Number);
  return { year, month };
}

function mapRecurringProfile(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    organization_id: row.organization_id,
    client_id: row.client_id,
    service_id: row.service_id,
    descricao: row.descricao ?? "",
    valor: Number(row.valor ?? 0),
    data_inicio: row.data_inicio,
    data_fim: row.data_fim ?? null,
    dia_cobranca_1: Number(row.dia_cobranca_1),
    dia_cobranca_2: row.dia_cobranca_2 === null ? null : Number(row.dia_cobranca_2),
    dia_cobranca_3: row.dia_cobranca_3 === null ? null : Number(row.dia_cobranca_3),
    dia_cobranca_4: row.dia_cobranca_4 === null ? null : Number(row.dia_cobranca_4),
    chave_pix: row.chave_pix ?? "",
    mensagem_whatsapp_personalizada: row.mensagem_whatsapp_personalizada ?? "",
    observacoes: row.observacoes ?? "",
    ativo: Boolean(Number(row.ativo)),
    created_by_user_id: row.created_by_user_id ?? null,
    updated_by_user_id: row.updated_by_user_id ?? null,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function mapRecurringCharge(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    organization_id: row.organization_id,
    recurring_profile_id: row.recurring_profile_id,
    client_id: row.client_id,
    client_name: row.client_name,
    service_id: row.service_id,
    service_name: row.service_name,
    descricao: row.descricao ?? "",
    valor: Number(row.valor ?? 0),
    referencia_competencia: row.referencia_competencia,
    referencia_data_cobranca: row.referencia_data_cobranca,
    data_vencimento: row.data_vencimento,
    status: row.status,
    data_pagamento: row.data_pagamento ?? null,
    forma_pagamento: row.forma_pagamento ?? null,
    observacoes: row.observacoes ?? "",
    chave_pix_utilizada: row.chave_pix_utilizada ?? "",
    mensagem_whatsapp_utilizada: row.mensagem_whatsapp_utilizada ?? "",
    whatsapp_enviado: Boolean(Number(row.whatsapp_enviado)),
    whatsapp_status: row.whatsapp_status ?? null,
    whatsapp_tentativas: Number(row.whatsapp_tentativas ?? 0),
    whatsapp_ultimo_envio_em: row.whatsapp_ultimo_envio_em ?? null,
    whatsapp_ultimo_erro: row.whatsapp_ultimo_erro ?? null,
    criado_automaticamente: Boolean(Number(row.criado_automaticamente)),
    created_by_user_id: row.created_by_user_id ?? null,
    updated_by_user_id: row.updated_by_user_id ?? null,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function buildDays(profile) {
  return profile.dia_cobranca_1 ? [profile.dia_cobranca_1] : [];
}

function buildTemplateMessage(template, data) {
  return (normalizeString(template) || DEFAULT_RECURRING_WHATSAPP_TEMPLATE)
    .replaceAll("{NOME_CLIENTE}", data.clientName)
    .replaceAll("{NOME_SERVICO}", data.serviceName)
    .replaceAll("{VALOR}", formatMoneyBR(data.valor))
    .replaceAll("{DATA_VENCIMENTO}", formatDateBR(data.dataVencimento))
    .replaceAll("{CHAVE_PIX}", data.chavePix || "Nao informado")
    .replaceAll("{EMPRESA_NOME}", data.organizationName);
}

function normalizeRecurringInput(input = {}, { partial = false } = {}) {
  const normalized = {
    client_id: normalizeString(input.client_id ?? input.clientId),
    service_id: normalizeString(input.service_id ?? input.serviceId),
    descricao: normalizeString(input.descricao ?? input.description),
    valor: input.valor ?? input.value,
    data_inicio: normalizeString(input.data_inicio ?? input.dataInicio),
    data_fim: normalizeString(input.data_fim ?? input.dataFim),
    dia_cobranca_1: input.dia_cobranca_1 ?? input.diaCobranca1,
    dia_cobranca_2: input.dia_cobranca_2 ?? input.diaCobranca2,
    dia_cobranca_3: input.dia_cobranca_3 ?? input.diaCobranca3,
    dia_cobranca_4: input.dia_cobranca_4 ?? input.diaCobranca4,
    chave_pix: normalizeString(input.chave_pix ?? input.chavePix),
    observacoes: normalizeString(input.observacoes ?? input.notes),
    ativo: input.ativo,
  };

  if (!partial || input.client_id !== undefined || input.clientId !== undefined) {
    if (!normalized.client_id) {
      throw buildError("Cliente obrigatorio para criar a recorrencia.", 400);
    }
  }

  if (!partial || input.service_id !== undefined || input.serviceId !== undefined) {
    if (!normalized.service_id) {
      throw buildError("Servico obrigatorio para criar a recorrencia.", 400);
    }
  }

  if (!partial || input.valor !== undefined || input.value !== undefined) {
    const valor = normalizeMoney(normalized.valor);

    if (!Number.isFinite(valor) || valor <= 0) {
      throw buildError("Valor deve ser maior que zero.", 400);
    }

    normalized.valor = valor;
  } else {
    normalized.valor = undefined;
  }

  if (!partial || input.data_inicio !== undefined || input.dataInicio !== undefined) {
    if (!isValidDate(normalized.data_inicio)) {
      throw buildError("Data inicial invalida.", 400);
    }
  }

  if ((!partial || input.data_fim !== undefined || input.dataFim !== undefined) && normalized.data_fim) {
    if (!isValidDate(normalized.data_fim)) {
      throw buildError("Data final invalida.", 400);
    }
  }

  const billingDay = normalizeDay(normalized.dia_cobranca_1);
  const shouldValidateBillingDay =
    !partial || input.dia_cobranca_1 !== undefined || input.diaCobranca1 !== undefined;

  if (shouldValidateBillingDay) {
    if (!Number.isInteger(billingDay)) {
      throw buildError("Informe o dia do pagamento.", 400);
    }

    if (billingDay < 1 || billingDay > 31) {
      throw buildError("O dia do pagamento deve estar entre 1 e 31.", 400);
    }
  }

  normalized.dia_cobranca_1 = shouldValidateBillingDay ? billingDay : undefined;
  normalized.dia_cobranca_2 = shouldValidateBillingDay ? null : undefined;
  normalized.dia_cobranca_3 = shouldValidateBillingDay ? null : undefined;
  normalized.dia_cobranca_4 = shouldValidateBillingDay ? null : undefined;
  normalized.mensagem_whatsapp_personalizada = "";

  if (normalized.data_inicio && normalized.data_fim && normalized.data_fim < normalized.data_inicio) {
    throw buildError("Data final nao pode ser menor que a data inicial.", 400);
  }

  if (input.ativo !== undefined) {
    normalized.ativo = normalizeBoolean(input.ativo);
  } else {
    normalized.ativo = partial ? undefined : true;
  }

  return normalized;
}

async function getRecurringProfileRow(organizationId, profileId) {
  const rows = await query(
    `SELECT * FROM recurring_profiles WHERE organization_id = ? AND id = ? LIMIT 1`,
    [organizationId, profileId],
  );
  return rows[0] ?? null;
}

async function getRecurringChargeRow(organizationId, chargeId) {
  const rows = await query(
    `SELECT * FROM recurring_charges WHERE organization_id = ? AND id = ? LIMIT 1`,
    [organizationId, chargeId],
  );
  return rows[0] ?? null;
}

async function getRecurringProfileOrFail(organizationId, profileId) {
  const profile = mapRecurringProfile(await getRecurringProfileRow(organizationId, profileId));

  if (!profile) {
    throw buildError("Recorrencia nao encontrada.", 404);
  }

  return profile;
}

async function getRecurringChargeOrFail(organizationId, chargeId) {
  const charge = mapRecurringCharge(await getRecurringChargeRow(organizationId, chargeId));

  if (!charge) {
    throw buildError("Cobranca recorrente nao encontrada.", 404);
  }

  return charge;
}

async function logRecurringEvent({
  organizationId,
  recurringProfileId = null,
  recurringChargeId = null,
  tipoEvento,
  descricao = "",
  payload = null,
  createdByUserId = null,
  connection = null,
}) {
  const executor = connection ?? { execute };
  await executor.execute(
    `INSERT INTO recurring_logs (
      id, organization_id, recurring_profile_id, recurring_charge_id,
      tipo_evento, descricao, payload_json, created_by_user_id
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      randomUUID(),
      organizationId,
      recurringProfileId,
      recurringChargeId,
      tipoEvento,
      descricao || null,
      payload ? JSON.stringify(payload) : null,
      createdByUserId,
    ],
  );
}

async function buildChargeMessage({ organizationId, charge, profile }) {
  const [settings, organization] = await Promise.all([
    getAppSettingsByOrganization(organizationId),
    getOrganizationById(organizationId),
  ]);
  const template = DEFAULT_RECURRING_WHATSAPP_TEMPLATE;

  return buildTemplateMessage(template, {
    clientName: charge.client_name,
    serviceName: charge.service_name,
    valor: charge.valor,
    dataVencimento: charge.data_vencimento,
    chavePix: charge.chave_pix_utilizada,
    organizationName: organization?.nome_empresa ?? settings?.nome_negocio ?? "AgendaPro",
  });
}

async function sendChargeWhatsappInternal({
  organizationId,
  charge,
  profile = null,
  createdByUserId = null,
  connection = null,
}) {
  const client = await getClientByIdForOrganization(organizationId, charge.client_id);

  if (!client?.telefone?.trim()) {
    const errorMessage = "Cliente sem telefone para envio de cobranca recorrente.";
    const executor = connection ?? { execute: query };
    await executor.execute(
      `UPDATE recurring_charges
        SET whatsapp_status = ?, whatsapp_ultimo_erro = ?, whatsapp_tentativas = whatsapp_tentativas + 1
        WHERE organization_id = ? AND id = ?`,
      ["falha", errorMessage, organizationId, charge.id],
    );
    throw buildError(errorMessage, 400);
  }

  const message = await buildChargeMessage({ organizationId, charge, profile });
  const sentAt = new Date().toISOString().slice(0, 19).replace("T", " ");
  const executor = connection ?? { execute: query };

  try {
    await sendWhatsappMessage({
      organizationId,
      phone: client.telefone,
      message,
    });

    await executor.execute(
      `UPDATE recurring_charges
        SET mensagem_whatsapp_utilizada = ?, whatsapp_enviado = 1, whatsapp_status = ?, whatsapp_tentativas = whatsapp_tentativas + 1,
            whatsapp_ultimo_envio_em = ?, whatsapp_ultimo_erro = NULL
        WHERE organization_id = ? AND id = ?`,
      [message, "sucesso", sentAt, organizationId, charge.id],
    );

    await logRecurringEvent({
      organizationId,
      recurringProfileId: charge.recurring_profile_id,
      recurringChargeId: charge.id,
      tipoEvento: "whatsapp_enviado",
      descricao: "Mensagem de cobranca recorrente enviada com sucesso.",
      payload: { message },
      createdByUserId,
      connection,
    });
  } catch (error) {
    const errorMessage = error.message ?? "Falha ao enviar WhatsApp.";
    await executor.execute(
      `UPDATE recurring_charges
        SET mensagem_whatsapp_utilizada = ?, whatsapp_status = ?, whatsapp_tentativas = whatsapp_tentativas + 1,
            whatsapp_ultimo_envio_em = ?, whatsapp_ultimo_erro = ?
        WHERE organization_id = ? AND id = ?`,
      [message, "falha", sentAt, String(errorMessage), organizationId, charge.id],
    );

    await logRecurringEvent({
      organizationId,
      recurringProfileId: charge.recurring_profile_id,
      recurringChargeId: charge.id,
      tipoEvento: "whatsapp_falha",
      descricao: "Falha ao enviar cobranca recorrente por WhatsApp.",
      payload: { error: errorMessage },
      createdByUserId,
      connection,
    });

    throw error;
  }
}

function shouldGenerateChargeForDate(profile, targetDate) {
  if (!profile.ativo) {
    return false;
  }

  if (profile.data_inicio > targetDate) {
    return false;
  }

  if (profile.data_fim && profile.data_fim < targetDate) {
    return false;
  }

  const { year, month } = parseDateParts(targetDate);
  const validDates = buildDays(profile).map((day) => resolveBillingDateForMonth(year, month, day));

  return validDates.includes(targetDate);
}

export async function listRecurringProfiles({
  organizationId,
  filters = {},
}) {
  const conditions = ["organization_id = ?"];
  const params = [organizationId];

  if (normalizeString(filters.client_id ?? filters.clientId)) {
    conditions.push("client_id = ?");
    params.push(normalizeString(filters.client_id ?? filters.clientId));
  }

  if (normalizeString(filters.service_id ?? filters.serviceId)) {
    conditions.push("service_id = ?");
    params.push(normalizeString(filters.service_id ?? filters.serviceId));
  }

  if (filters.ativo !== undefined && filters.ativo !== "all") {
    const ativo = String(filters.ativo) === "true" || String(filters.ativo) === "1";
    conditions.push("ativo = ?");
    params.push(ativo ? 1 : 0);
  }

  const search = normalizeString(filters.search ?? filters.q);
  if (search) {
    conditions.push("(descricao LIKE ? OR observacoes LIKE ?)");
    params.push(`%${search}%`, `%${search}%`);
  }

  const rows = await query(
    `SELECT * FROM recurring_profiles
      WHERE ${conditions.join(" AND ")}
      ORDER BY created_at DESC`,
    params,
  );

  return rows.map(mapRecurringProfile);
}

export async function getRecurringProfile({ organizationId, profileId }) {
  return getRecurringProfileOrFail(organizationId, profileId);
}

export async function createRecurringProfile({ organizationId, input, createdByUserId = null }) {
  const normalized = normalizeRecurringInput(input);
  const [client, service, settings] = await Promise.all([
    getClientByIdForOrganization(organizationId, normalized.client_id),
    getServiceByIdForOrganization(organizationId, normalized.service_id),
    getAppSettingsByOrganization(organizationId),
  ]);

  if (!client) {
    throw buildError("Cliente da recorrencia nao encontrado.", 404);
  }

  if (!service) {
    throw buildError("Servico da recorrencia nao encontrado.", 404);
  }

  const id = randomUUID();
  const descricao = normalized.descricao || service.nome;
  const chavePix = normalized.chave_pix || settings?.recurring_chave_pix_padrao || null;

  await withTransaction(async (connection) => {
    await connection.execute(
      `INSERT INTO recurring_profiles (
        id, organization_id, client_id, service_id, descricao, valor, data_inicio, data_fim,
        dia_cobranca_1, dia_cobranca_2, dia_cobranca_3, dia_cobranca_4,
        chave_pix, mensagem_whatsapp_personalizada, observacoes, ativo,
        created_by_user_id, updated_by_user_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        organizationId,
        normalized.client_id,
        normalized.service_id,
        descricao,
        normalized.valor,
        normalized.data_inicio,
        normalized.data_fim || null,
        normalized.dia_cobranca_1,
        null,
        null,
        null,
        chavePix,
        null,
        normalized.observacoes || null,
        normalized.ativo ? 1 : 0,
        createdByUserId,
        createdByUserId,
      ],
    );

    await logRecurringEvent({
      organizationId,
      recurringProfileId: id,
      tipoEvento: "recorrencia_criada",
      descricao: "Recorrencia criada com sucesso.",
      payload: normalized,
      createdByUserId,
      connection,
    });
  });

  return getRecurringProfile({ organizationId, profileId: id });
}

export async function updateRecurringProfile({
  organizationId,
  profileId,
  input,
  updatedByUserId = null,
}) {
  const current = await getRecurringProfileOrFail(organizationId, profileId);
  const normalized = normalizeRecurringInput(input, { partial: true });
  const next = {
    ...current,
    ...Object.fromEntries(Object.entries(normalized).filter(([, value]) => value !== undefined)),
  };

  normalizeRecurringInput(next);

  const [client, service, settings] = await Promise.all([
    getClientByIdForOrganization(organizationId, next.client_id),
    getServiceByIdForOrganization(organizationId, next.service_id),
    getAppSettingsByOrganization(organizationId),
  ]);

  if (!client) {
    throw buildError("Cliente da recorrencia nao encontrado.", 404);
  }

  if (!service) {
    throw buildError("Servico da recorrencia nao encontrado.", 404);
  }

  const chavePix = next.chave_pix || settings?.recurring_chave_pix_padrao || null;

  await withTransaction(async (connection) => {
    await connection.execute(
      `UPDATE recurring_profiles
        SET client_id = ?, service_id = ?, descricao = ?, valor = ?, data_inicio = ?, data_fim = ?,
            dia_cobranca_1 = ?, dia_cobranca_2 = ?, dia_cobranca_3 = ?, dia_cobranca_4 = ?,
            chave_pix = ?, mensagem_whatsapp_personalizada = ?, observacoes = ?, ativo = ?, updated_by_user_id = ?
        WHERE organization_id = ? AND id = ?`,
      [
        next.client_id,
        next.service_id,
        next.descricao || service.nome,
        next.valor,
        next.data_inicio,
        next.data_fim || null,
        next.dia_cobranca_1,
        null,
        null,
        null,
        chavePix,
        null,
        next.observacoes || null,
        next.ativo ? 1 : 0,
        updatedByUserId,
        organizationId,
        profileId,
      ],
    );

    await logRecurringEvent({
      organizationId,
      recurringProfileId: profileId,
      tipoEvento: "recorrencia_atualizada",
      descricao: "Recorrencia atualizada com sucesso.",
      payload: next,
      createdByUserId: updatedByUserId,
      connection,
    });
  });

  return getRecurringProfile({ organizationId, profileId });
}

export async function toggleRecurringProfileActive({
  organizationId,
  profileId,
  ativo,
  updatedByUserId = null,
}) {
  const current = await getRecurringProfileOrFail(organizationId, profileId);
  const nextValue = Boolean(ativo);

  if (current.ativo === nextValue) {
    return current;
  }

  await withTransaction(async (connection) => {
    await connection.execute(
      `UPDATE recurring_profiles
        SET ativo = ?, updated_by_user_id = ?
        WHERE organization_id = ? AND id = ?`,
      [nextValue ? 1 : 0, updatedByUserId, organizationId, profileId],
    );

    await logRecurringEvent({
      organizationId,
      recurringProfileId: profileId,
      tipoEvento: nextValue ? "recorrencia_ativada" : "recorrencia_inativada",
      descricao: nextValue ? "Recorrencia ativada." : "Recorrencia inativada.",
      createdByUserId: updatedByUserId,
      connection,
    });
  });

  return getRecurringProfile({ organizationId, profileId });
}

export async function deleteRecurringProfile({
  organizationId,
  profileId,
  deletedByUserId = null,
}) {
  await getRecurringProfileOrFail(organizationId, profileId);

  const charges = await query(
    `SELECT COUNT(*) AS total
      FROM recurring_charges
      WHERE organization_id = ? AND recurring_profile_id = ?`,
    [organizationId, profileId],
  );

  if (Number(charges[0]?.total ?? 0) > 0) {
    throw buildError(
      "Esta recorrencia ja possui cobrancas geradas. Inative a recorrencia em vez de excluir.",
      409,
    );
  }

  await withTransaction(async (connection) => {
    await logRecurringEvent({
      organizationId,
      recurringProfileId: profileId,
      tipoEvento: "recorrencia_excluida",
      descricao: "Recorrencia excluida.",
      createdByUserId: deletedByUserId,
      connection,
    });

    await connection.execute(
      `DELETE FROM recurring_profiles WHERE organization_id = ? AND id = ?`,
      [organizationId, profileId],
    );
  });
}

export async function listRecurringCharges({
  organizationId,
  filters = {},
}) {
  const conditions = ["organization_id = ?"];
  const params = [organizationId];

  if (normalizeString(filters.client_id ?? filters.clientId)) {
    conditions.push("client_id = ?");
    params.push(normalizeString(filters.client_id ?? filters.clientId));
  }

  if (normalizeString(filters.service_id ?? filters.serviceId)) {
    conditions.push("service_id = ?");
    params.push(normalizeString(filters.service_id ?? filters.serviceId));
  }

  if (normalizeString(filters.recurring_profile_id ?? filters.profileId)) {
    conditions.push("recurring_profile_id = ?");
    params.push(normalizeString(filters.recurring_profile_id ?? filters.profileId));
  }

  if (normalizeString(filters.status) && filters.status !== "all") {
    conditions.push("status = ?");
    params.push(normalizeString(filters.status));
  }

  if (isValidDate(filters.start_date ?? filters.startDate)) {
    conditions.push("data_vencimento >= ?");
    params.push(filters.start_date ?? filters.startDate);
  }

  if (isValidDate(filters.end_date ?? filters.endDate)) {
    conditions.push("data_vencimento <= ?");
    params.push(filters.end_date ?? filters.endDate);
  }

  const rows = await query(
    `SELECT * FROM recurring_charges
      WHERE ${conditions.join(" AND ")}
      ORDER BY data_vencimento DESC, created_at DESC`,
    params,
  );

  return rows.map(mapRecurringCharge);
}

export async function getRecurringCharge({ organizationId, chargeId }) {
  return getRecurringChargeOrFail(organizationId, chargeId);
}

export async function listChargesByRecurringProfile({ organizationId, profileId }) {
  await getRecurringProfileOrFail(organizationId, profileId);
  return listRecurringCharges({
    organizationId,
    filters: { recurring_profile_id: profileId },
  });
}

export async function markRecurringChargeAsPaid({
  organizationId,
  chargeId,
  input = {},
  updatedByUserId = null,
}) {
  const current = await getRecurringChargeOrFail(organizationId, chargeId);

  if (current.status === "cancelado") {
    throw buildError("Nao e possivel pagar uma cobranca cancelada.", 409);
  }

  const paymentDate =
    normalizeString(input.data_pagamento ?? input.dataPagamento) ||
    new Date().toISOString().slice(0, 19).replace("T", " ");
  const paymentMethod = normalizeString(input.forma_pagamento ?? input.formaPagamento) || null;
  const notes = normalizeString(input.observacoes ?? input.notes) || current.observacoes || null;

  await withTransaction(async (connection) => {
    await connection.execute(
      `UPDATE recurring_charges
        SET status = 'pago', data_pagamento = ?, forma_pagamento = ?, observacoes = ?, updated_by_user_id = ?
        WHERE organization_id = ? AND id = ?`,
      [paymentDate, paymentMethod, notes, updatedByUserId, organizationId, chargeId],
    );

    await logRecurringEvent({
      organizationId,
      recurringProfileId: current.recurring_profile_id,
      recurringChargeId: chargeId,
      tipoEvento: "cobranca_paga",
      descricao: "Cobranca marcada como paga.",
      payload: { paymentDate, paymentMethod, notes },
      createdByUserId: updatedByUserId,
      connection,
    });
  });

  return getRecurringCharge({ organizationId, chargeId });
}

export async function cancelRecurringCharge({
  organizationId,
  chargeId,
  input = {},
  updatedByUserId = null,
}) {
  const current = await getRecurringChargeOrFail(organizationId, chargeId);

  if (current.status === "pago") {
    throw buildError("Nao e possivel cancelar uma cobranca paga.", 409);
  }

  const notes =
    normalizeString(input.observacoes ?? input.notes) || current.observacoes || "Cobranca cancelada manualmente.";

  await withTransaction(async (connection) => {
    await connection.execute(
      `UPDATE recurring_charges
        SET status = 'cancelado', observacoes = ?, updated_by_user_id = ?
        WHERE organization_id = ? AND id = ?`,
      [notes, updatedByUserId, organizationId, chargeId],
    );

    await logRecurringEvent({
      organizationId,
      recurringProfileId: current.recurring_profile_id,
      recurringChargeId: chargeId,
      tipoEvento: "cobranca_cancelada",
      descricao: "Cobranca cancelada manualmente.",
      payload: { notes },
      createdByUserId: updatedByUserId,
      connection,
    });
  });

  return getRecurringCharge({ organizationId, chargeId });
}

export async function resendRecurringChargeWhatsapp({
  organizationId,
  chargeId,
  createdByUserId = null,
}) {
  const charge = await getRecurringChargeOrFail(organizationId, chargeId);
  const profile = await getRecurringProfileOrFail(organizationId, charge.recurring_profile_id);
  await sendChargeWhatsappInternal({
    organizationId,
    charge,
    profile,
    createdByUserId,
  });
  return getRecurringCharge({ organizationId, chargeId });
}

export async function getRecurringSummary({
  organizationId,
  referenceDate = new Date().toISOString().slice(0, 10),
}) {
  const monthKey = getCompetencia(referenceDate);
  const [activeProfilesRows, monthlyCharges] = await Promise.all([
    query(
      `SELECT COUNT(*) AS total
        FROM recurring_profiles
        WHERE organization_id = ? AND ativo = 1`,
      [organizationId],
    ),
    query(
      `SELECT status, COALESCE(SUM(valor), 0) AS total, COUNT(*) AS quantidade
        FROM recurring_charges
        WHERE organization_id = ? AND referencia_competencia = ?
        GROUP BY status`,
      [organizationId, monthKey],
    ),
  ]);

  const grouped = new Map(monthlyCharges.map((row) => [row.status, row]));
  return {
    activeProfiles: Number(activeProfilesRows[0]?.total ?? 0),
    pendingCharges: Number(grouped.get("pendente")?.quantidade ?? 0),
    paidCharges: Number(grouped.get("pago")?.quantidade ?? 0),
    overdueCharges: Number(grouped.get("vencido")?.quantidade ?? 0),
    totalPendingAmount: Number(grouped.get("pendente")?.total ?? 0),
    referenceMonth: monthKey,
  };
}

async function generateChargeForProfile({
  organizationId,
  profile,
  targetDate,
  createdByUserId = null,
}) {
  const [client, service] = await Promise.all([
    getClientByIdForOrganization(organizationId, profile.client_id),
    getServiceByIdForOrganization(organizationId, profile.service_id),
  ]);

  if (!client || !service) {
    throw buildError("Cliente ou servico da recorrencia nao encontrado.", 404);
  }

  const chargeId = randomUUID();
  const chargePayload = {
    id: chargeId,
    organization_id: organizationId,
    recurring_profile_id: profile.id,
    client_id: profile.client_id,
    client_name: client.nome,
    service_id: profile.service_id,
    service_name: service.nome,
    descricao: profile.descricao || service.nome,
    valor: profile.valor,
    referencia_competencia: getCompetencia(targetDate),
    referencia_data_cobranca: targetDate,
    data_vencimento: targetDate,
    status: "pendente",
    observacoes: profile.observacoes || null,
    chave_pix_utilizada: profile.chave_pix || null,
  };

  await withTransaction(async (connection) => {
    await connection.execute(
      `INSERT INTO recurring_charges (
        id, organization_id, recurring_profile_id, client_id, client_name, service_id, service_name,
        descricao, valor, referencia_competencia, referencia_data_cobranca, data_vencimento,
        status, observacoes, chave_pix_utilizada, criado_automaticamente, created_by_user_id, updated_by_user_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        chargePayload.id,
        chargePayload.organization_id,
        chargePayload.recurring_profile_id,
        chargePayload.client_id,
        chargePayload.client_name,
        chargePayload.service_id,
        chargePayload.service_name,
        chargePayload.descricao,
        chargePayload.valor,
        chargePayload.referencia_competencia,
        chargePayload.referencia_data_cobranca,
        chargePayload.data_vencimento,
        chargePayload.status,
        chargePayload.observacoes,
        chargePayload.chave_pix_utilizada,
        1,
        createdByUserId,
        createdByUserId,
      ],
    );

    await logRecurringEvent({
      organizationId,
      recurringProfileId: profile.id,
      recurringChargeId: chargeId,
      tipoEvento: "cobranca_gerada",
      descricao: "Cobranca recorrente gerada automaticamente.",
      payload: chargePayload,
      createdByUserId,
      connection,
    });
  });

  return getRecurringCharge({ organizationId, chargeId });
}

async function markOverdueChargesForOrganization({ organizationId, targetDate }) {
  const settings = await getAppSettingsByOrganization(organizationId);

  if (!settings?.criar_recorrencias || !settings?.recurring_marcar_vencido_automaticamente) {
    return { updated: 0 };
  }

  const result = await execute(
    `UPDATE recurring_charges
      SET status = 'vencido'
      WHERE organization_id = ?
        AND status = 'pendente'
        AND data_vencimento < ?`,
    [organizationId, targetDate],
  );

  return { updated: Number(result.affectedRows ?? 0) };
}

export async function processRecurringAutomation({
  organizationId = null,
  targetDate = new Date().toISOString().slice(0, 10),
  createdByUserId = null,
  sendWhatsapp = true,
} = {}) {
  const organizations = organizationId ? [{ id: organizationId }] : await listOrganizations();
  const result = {
    processedOrganizations: 0,
    generatedCharges: 0,
    sentWhatsapp: 0,
    errors: [],
  };

  for (const organization of organizations) {
    result.processedOrganizations += 1;

    try {
      const profiles = await listRecurringProfiles({
        organizationId: organization.id,
        filters: { ativo: true },
      });
      const settings = await getAppSettingsByOrganization(organization.id);

      if (!settings?.criar_recorrencias) {
        continue;
      }

      await markOverdueChargesForOrganization({
        organizationId: organization.id,
        targetDate,
      });

      for (const profile of profiles) {
        if (!shouldGenerateChargeForDate(profile, targetDate)) {
          continue;
        }

        try {
          const charge = await generateChargeForProfile({
            organizationId: organization.id,
            profile,
            targetDate,
            createdByUserId,
          });
          result.generatedCharges += 1;

          if (sendWhatsapp && settings?.recurring_whatsapp_automatico) {
            await sendChargeWhatsappInternal({
              organizationId: organization.id,
              charge,
              profile,
              createdByUserId,
            });
            result.sentWhatsapp += 1;
          }
        } catch (error) {
          if (error?.code === "ER_DUP_ENTRY") {
            continue;
          }

          result.errors.push({
            organizationId: organization.id,
            profileId: profile.id,
            message: error.message ?? "Erro ao processar recorrencia.",
          });
        }
      }
    } catch (error) {
      result.errors.push({
        organizationId: organization.id,
        message: error.message ?? "Erro ao processar organizacao.",
      });
    }
  }

  return result;
}

export const __testables = {
  DEFAULT_RECURRING_WHATSAPP_TEMPLATE,
  buildTemplateMessage,
  normalizeRecurringInput,
  resolveBillingDateForMonth,
  shouldGenerateChargeForDate,
};
