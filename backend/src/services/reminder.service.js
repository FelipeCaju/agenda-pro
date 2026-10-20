import {
  getAppSettingsByOrganization,
  getAppointmentByIdForOrganization,
  getClientByIdForOrganization,
  getOrganizationById,
  listAllAppointmentsByOrganization,
  listClientsByOrganization,
  listOrganizations,
  updateAppointmentForOrganization,
} from "../lib/data.js";
import { isWhatsappDeliveryAvailable, sendWhatsappMessage } from "./whatsapp.service.js";
import { beginMessageDelivery, finishMessageDelivery, withMessageLock } from "./message-lock.service.js";
import { query } from "../lib/database.js";

const VALID_REPLY_STATUS = ["pendente", "confirmado", "cancelado", "sem_resposta"];
const DEFAULT_WHATSAPP_REMINDER_TEMPLATE =
  "Bom dia, aqui e da {{nome_organizacao}}.\n\nOie {{cliente_nome}}! \u{1F44B}\n\nPassando para te lembrar do seu horario de {{servico_nome}}.\n\n\u{1F4C5} Data: {{data}}\n\u23F0 Horario: {{horario}}\n\nEstamos te aguardando por aqui. \u{1F49A}";
const LEGACY_WHATSAPP_CONFIRMATION_PROMPT = "Responda com 1 para confirmar ou 2 para cancelar.";

function buildError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function nowIso() {
  return new Date().toISOString();
}

function normalizePhone(phone) {
  const digits = String(phone ?? "").replace(/\D/g, "");

  if (!digits) {
    return "";
  }

  return digits.startsWith("55") ? digits : `55${digits}`;
}

function toDateTime(date, time, timezone) {
  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);
  const desired = Date.UTC(year, month - 1, day, hour, minute);
  const options = {
    year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit",
    hourCycle: "h23",
  };
  let formatter;
  try {
    formatter = new Intl.DateTimeFormat("en-CA", { ...options, timeZone: timezone || "America/Sao_Paulo" });
  } catch {
    formatter = new Intl.DateTimeFormat("en-CA", { ...options, timeZone: "America/Sao_Paulo" });
  }
  let timestamp = desired;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const parts = Object.fromEntries(formatter.formatToParts(new Date(timestamp)).map(({ type, value }) => [type, value]));
    const represented = Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day), Number(parts.hour), Number(parts.minute));
    const adjustment = desired - represented;
    timestamp += adjustment;
    if (!adjustment) break;
  }
  return new Date(timestamp);
}

function buildScheduledAt(appointment) {
  return `${appointment.data}T${appointment.horario_inicial}:00`;
}

function formatDateBR(date) {
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return date ?? "";
  }

  const [year, month, day] = date.split("-");
  return `${day}/${month}/${year}`;
}

function normalizeReminderTemplate(template) {
  const normalized = typeof template === "string" ? template.trim() : "";

  if (!normalized) {
    return DEFAULT_WHATSAPP_REMINDER_TEMPLATE;
  }

  const hasRequiredVariables =
    normalized.includes("{{cliente_nome}}") &&
    normalized.includes("{{servico_nome}}") &&
    normalized.includes("{{data}}") &&
    normalized.includes("{{horario}}");

  if (!hasRequiredVariables) {
    return DEFAULT_WHATSAPP_REMINDER_TEMPLATE;
  }

  return normalized
    .replace(LEGACY_WHATSAPP_CONFIRMATION_PROMPT, "")
    .replace("Confirmar agendamento?\nResponda com Sim ou Nao.", "")
    .trim();
}

function getReminderLeadMinutes(settings) {
  try {
    const source = Array.isArray(settings.whatsapp_lembrete_minutos)
      ? settings.whatsapp_lembrete_minutos
      : JSON.parse(settings.whatsapp_lembrete_minutos || "[]");
    const values = [...new Set(source.map(Number).filter((value) => Number.isInteger(value) && value >= 0 && value <= 10080))];
    if (values.length) return values.slice(0, 3);
  } catch {
    // Mantem compatibilidade com configuracoes anteriores.
  }
  return [Number(settings.whatsapp_tempo_lembrete_minutos ?? 60)];
}

function buildReminderStatus(appointment) {
  if (appointment.lembrete_cancelado) {
    return "cancelado";
  }

  if (appointment.lembrete_confirmado) {
    return "confirmado";
  }

  if (appointment.lembrete_enviado) {
    return "enviado";
  }

  return "pendente";
}

function buildReminder({ appointment, client, settings }) {
  return {
    id: appointment.id,
    appointmentId: appointment.id,
    title: `Lembrete para ${appointment.cliente_nome}`,
    channel: settings?.whatsapp_ativo ? "whatsapp" : "manual",
    scheduledAt: buildScheduledAt(appointment),
    clienteNome: appointment.cliente_nome,
    clienteTelefone: client?.telefone ?? null,
    clienteEmail: appointment.cliente_email ?? null,
    servicoNome: appointment.servico_nome,
    reminderStatus: buildReminderStatus(appointment),
    lembreteEnviado: Boolean(appointment.lembrete_enviado),
    lembreteConfirmado: Boolean(appointment.lembrete_confirmado),
    lembreteCancelado: Boolean(appointment.lembrete_cancelado),
    confirmacaoCliente: appointment.confirmacao_cliente ?? "pendente",
    respostaWhatsapp: appointment.resposta_whatsapp ?? null,
    dataEnvioLembrete: appointment.data_envio_lembrete ?? null,
    canSend: Boolean(settings?.lembretes_ativos && settings?.whatsapp_ativo),
  };
}

async function getAppointmentsForOrganization(organizationId) {
  return listAllAppointmentsByOrganization(organizationId);
}

async function getOrganizationSettings(organizationId) {
  const settings = await getAppSettingsByOrganization(organizationId);

  if (!settings) {
    throw buildError("Configuracoes da empresa nao encontradas.", 404);
  }

  return settings;
}

async function getOrganizationAppointment(organizationId, appointmentId) {
  const appointment = await getAppointmentByIdForOrganization(organizationId, appointmentId);

  if (!appointment) {
    throw buildError("Agendamento nao encontrado para lembrete.", 404);
  }

  return appointment;
}

async function getAppointmentClient(organizationId, appointment) {
  const client = await getClientByIdForOrganization(organizationId, appointment.cliente_id);

  if (!client) {
    throw buildError("Cliente do lembrete nao encontrado.", 404);
  }

  return client;
}

function buildReminderMessage({ appointment, settings }) {
  const organizationName = settings.nome_negocio?.trim() || "nossa equipe";
  const template = normalizeReminderTemplate(settings.lembrete_mensagem);

  return template
    .replaceAll("{{cliente_nome}}", appointment.cliente_nome)
    .replaceAll("{{nome_organizacao}}", organizationName)
    .replaceAll("{{servico_nome}}", appointment.servico_nome)
    .replaceAll("{{horario}}", appointment.horario_inicial)
    .replaceAll("{{data}}", formatDateBR(appointment.data));
}

export function isReminderDue({ appointment, settings, now, leadMinutes }) {
  if (!settings.lembretes_ativos || !settings.whatsapp_ativo) {
    return false;
  }

  if ((leadMinutes === undefined && appointment.lembrete_enviado) || ["cancelado", "concluido"].includes(appointment.status)) {
    return false;
  }

  const reminderLeadMinutes = leadMinutes ?? Number(settings.whatsapp_tempo_lembrete_minutos ?? 60);
  const appointmentAt = toDateTime(appointment.data, appointment.horario_inicial, settings.timezone);
  const reminderAt = new Date(
    appointmentAt.getTime() - reminderLeadMinutes * 60 * 1000,
  );

  return reminderAt <= now && appointmentAt >= now;
}

export async function listOrganizationReminders({ organizationId }) {
  const [settings, appointments, clients, deliveries] = await Promise.all([
    getOrganizationSettings(organizationId),
    getAppointmentsForOrganization(organizationId),
    listClientsByOrganization(organizationId),
    query("SELECT item_id, status, last_error FROM whatsapp_delivery_guards WHERE organization_id = ? AND kind = 'reminder'", [organizationId]),
  ]);
  const clientsById = new Map(clients.map((client) => [client.id, client]));
  const deliveriesById = new Map(deliveries.map((delivery) => [delivery.item_id, delivery]));

  return appointments.map((appointment) => {
    const delivery = deliveriesById.get(appointment.id);
    return { ...buildReminder({
      appointment,
      client: clientsById.get(appointment.cliente_id) ?? null,
      settings,
    }), deliveryStatus: delivery?.status ?? null, deliveryError: delivery?.last_error ?? null };
  });
}

export async function sendManualReminder({ organizationId, appointmentId }) {
  return withMessageLock("reminder", organizationId, appointmentId, async () => {
  const settings = await getOrganizationSettings(organizationId);

  if (!settings.lembretes_ativos || !settings.whatsapp_ativo) {
    throw buildError("WhatsApp ou lembretes estao desativados para esta empresa.", 400);
  }

  const appointment = await getOrganizationAppointment(organizationId, appointmentId);
  if (["cancelado", "concluido"].includes(appointment.status)) {
    throw buildError("Nao e possivel enviar lembrete para atendimento cancelado ou concluido.", 400);
  }
  const client = await getAppointmentClient(organizationId, appointment);

  if (!client.telefone?.trim()) {
    throw buildError("Cliente sem telefone para envio do lembrete.", 400);
  }

  await beginMessageDelivery(organizationId, "reminder", appointmentId, { allowResend: true });
  try {
    await sendWhatsappMessage({
    organizationId,
    phone: client.telefone,
    message: buildReminderMessage({ appointment, settings }),
    });
  } catch (error) {
    await finishMessageDelivery(organizationId, "reminder", appointmentId, error.deliveryUncertain ? "incerto" : "falha", error.message);
    throw error;
  }

  const updated = await updateAppointmentForOrganization(organizationId, appointmentId, {
    lembrete_enviado: true,
    lembrete_confirmado: false,
    lembrete_cancelado: false,
    data_envio_lembrete: nowIso(),
    resposta_whatsapp: null,
  });
  await finishMessageDelivery(organizationId, "reminder", appointmentId, "enviado");

  return buildReminder({
    appointment: updated,
    client,
    settings,
  });
  });
}

export async function processAutomaticReminders() {
  const organizations = await listOrganizations();
  const now = new Date();

  for (const organization of organizations) {
    const [settings, appointments, clients] = await Promise.all([
      getOrganizationSettings(organization.id),
      getAppointmentsForOrganization(organization.id),
      listClientsByOrganization(organization.id),
    ]);
    const clientsById = new Map(clients.map((client) => [client.id, client]));

    if (
      !settings.lembretes_ativos ||
      !settings.whatsapp_ativo ||
      !(await isWhatsappDeliveryAvailable({ organizationId: organization.id }))
    ) {
      continue;
    }

    for (const appointment of appointments) {

      const client = clientsById.get(appointment.cliente_id);

      if (!client?.telefone?.trim()) {
        continue;
      }

      for (const leadMinutes of getReminderLeadMinutes(settings)) {
      if (!isReminderDue({ appointment, settings, now, leadMinutes })) continue;
      const deliveryKind = `reminder-${leadMinutes}`;
      try {
        await withMessageLock(deliveryKind, organization.id, appointment.id, async () => {
        const current = await getOrganizationAppointment(organization.id, appointment.id);
        if (!isReminderDue({ appointment: current, settings, now: new Date(), leadMinutes })) return;
        if (!(await beginMessageDelivery(organization.id, deliveryKind, appointment.id))) return;
        try {
        await sendWhatsappMessage({
          organizationId: organization.id,
          phone: client.telefone,
          message: buildReminderMessage({ appointment: current, settings }),
        });
        } catch (error) {
          await finishMessageDelivery(organization.id, deliveryKind, appointment.id, error.deliveryUncertain ? "incerto" : "falha", error.message);
          throw error;
        }

        await updateAppointmentForOrganization(organization.id, appointment.id, {
          lembrete_enviado: true,
          lembrete_confirmado: false,
          lembrete_cancelado: false,
          data_envio_lembrete: nowIso(),
          resposta_whatsapp: null,
        });
        await finishMessageDelivery(organization.id, deliveryKind, appointment.id, "enviado");
        });
      } catch (error) {
        console.error(
          `Falha ao enviar lembrete automatico do agendamento ${appointment.id}:`,
          error.message ?? error,
        );
      }
      }
    }
  }
}

export async function registerReminderReply({
  organizationId,
  appointmentId,
  replyStatus,
  responseText,
}) {
  if (!VALID_REPLY_STATUS.includes(replyStatus)) {
    throw buildError("Resposta do cliente invalida.", 400);
  }

  const settings = await getOrganizationSettings(organizationId);
  const appointment = await getOrganizationAppointment(organizationId, appointmentId);
  const client = await getAppointmentClient(organizationId, appointment);

  const updated = await updateAppointmentForOrganization(organizationId, appointmentId, {
    confirmacao_cliente: replyStatus,
    lembrete_confirmado: replyStatus === "confirmado",
    lembrete_cancelado: replyStatus === "cancelado",
    resposta_whatsapp: responseText ?? replyStatus,
    status:
      replyStatus === "confirmado"
        ? "confirmado"
        : replyStatus === "cancelado"
          ? "cancelado"
          : appointment.status,
  });

  return buildReminder({
    appointment: updated,
    client,
    settings,
  });
}

function parseReplyStatusFromText(message) {
  const normalized = String(message ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  if (!normalized) {
    return null;
  }

  if (["1", "confirmar", "confirmado", "confirmo", "sim", "s", "ok"].includes(normalized)) {
    return "confirmado";
  }

  if (["2", "cancelar", "cancelado", "cancelo", "nao", "n"].includes(normalized)) {
    return "cancelado";
  }

  return null;
}

async function findAppointmentByIncomingReply({ phone }) {
  const normalizedPhone = normalizePhone(phone);

  if (!normalizedPhone) {
    return { match: null, ambiguous: false };
  }

  const organizations = await listOrganizations();
  const matches = [];
  const earliestAllowed = new Date();
  earliestAllowed.setDate(earliestAllowed.getDate() - 1);

  for (const organization of organizations) {
    const [appointments, clients] = await Promise.all([
      listAllAppointmentsByOrganization(organization.id),
      listClientsByOrganization(organization.id),
    ]);
    const clientsById = new Map(clients.map((client) => [client.id, client]));

    for (const appointment of appointments) {
      if (
        !appointment.lembrete_enviado ||
        ["cancelado", "concluido"].includes(appointment.status) ||
        appointment.confirmacao_cliente !== "pendente" ||
        new Date(buildScheduledAt(appointment)) < earliestAllowed
      ) {
        continue;
      }

      const clientPhone = normalizePhone(clientsById.get(appointment.cliente_id)?.telefone);

      if (!clientPhone || clientPhone !== normalizedPhone) {
        continue;
      }

      matches.push({ organizationId: organization.id, appointment });
    }
  }

  if (matches.length !== 1) {
    return { match: null, ambiguous: matches.length > 1 };
  }

  return { match: matches[0], ambiguous: false };
}

export async function processIncomingWhatsappReply({ phone, message }) {
  const replyStatus = parseReplyStatusFromText(message);

  if (!replyStatus) {
    return {
      success: false,
      ignored: true,
      reason: "Mensagem sem comando reconhecido.",
    };
  }

  const { match, ambiguous } = await findAppointmentByIncomingReply({ phone });

  if (ambiguous) {
    return {
      success: false,
      ignored: true,
      reason: "Resposta ambigua: ha mais de um lembrete pendente para este telefone; confirme o atendimento manualmente.",
    };
  }

  if (!match) {
    return {
      success: false,
      ignored: true,
      reason: "Nenhum lembrete pendente encontrado para este telefone.",
    };
  }

  const reminder = await registerReminderReply({
    organizationId: match.organizationId,
    appointmentId: match.appointment.id,
    replyStatus,
    responseText: message,
  });

  try {
    await sendWhatsappMessage({
      organizationId: match.organizationId,
      phone,
      message:
        replyStatus === "confirmado"
          ? "Perfeito! Seu atendimento foi confirmado com sucesso."
          : "Tudo certo. Seu atendimento foi marcado como cancelado.",
    });
  } catch {
    // O processamento principal nao depende da mensagem de confirmacao.
  }

  return {
    success: true,
    ignored: false,
    reminder,
  };
}

export async function getReminderPreview({ organizationId }) {
  const settings = await getOrganizationSettings(organizationId);
  const organization = await getOrganizationById(organizationId);

  return buildReminderMessage({
    appointment: {
      cliente_nome: "Cliente",
      servico_nome: "Atendimento",
      horario_inicial: "14:00",
      data: "2026-03-18",
    },
    settings: {
      ...settings,
      nome_negocio: settings.nome_negocio || organization?.nome_empresa || "AgendaPro",
    },
  });
}
