import { randomUUID } from "node:crypto";
import {
  autoCancelStaleAppointmentsForOrganization,
  createAppointmentForOrganization,
  getAppSettingsByOrganization,
  getAppointmentByIdForOrganization,
  getClientByIdForOrganization,
  getProfessionalByIdForOrganization,
  getServiceByIdForOrganization,
  listBlockedSlotsByOrganization,
  listAppointmentsByOrganization,
  listUpcomingAppointmentsByOrganization,
  listProfessionalsByService,
  removeAppointmentForOrganization,
  removeAppointmentSeriesForOrganization,
  updateAppointmentForOrganization,
} from "../lib/data.js";
import { linkQuoteToAppointment } from "./quote.service.js";

function buildError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

const VALID_STATUS = ["pendente", "confirmado", "concluido", "cancelado"];
const VALID_PAYMENT_STATUS = ["pendente", "pago"];
const VALID_CONFIRMATION = ["pendente", "confirmado", "cancelado", "sem_resposta"];
const VALID_RECURRENCE_TYPES = ["none", "weekly", "biweekly", "monthly"];
const VALID_DELETE_SCOPES = ["single", "series"];

function normalizeString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeServiceColor(value) {
  const normalized = normalizeString(value);
  return normalized || "#1d8cf8";
}

function isValidDate(date) {
  return /^\d{4}-\d{2}-\d{2}$/.test(date);
}

function isValidTime(time) {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(time);
}

function isPastDate(date) {
  const today = new Date();
  const localToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const selected = new Date(`${date}T00:00:00`);
  return selected < localToday;
}

function timeToMinutes(time) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function hasConflict(appointments, input, ignoredAppointmentId) {
  const start = timeToMinutes(input.horario_inicial);
  const end = timeToMinutes(input.horario_final);

  return appointments.some((appointment) => {
    if (appointment.id === ignoredAppointmentId) {
      return false;
    }

    if (appointment.status === "cancelado") {
      return false;
    }

    if (appointment.data !== input.data) {
      return false;
    }

    if (
      input.profissional_id &&
      appointment.profissional_id &&
      appointment.profissional_id !== input.profissional_id
    ) {
      return false;
    }

    const appointmentStart = timeToMinutes(appointment.horario_inicial);
    const appointmentEnd = timeToMinutes(appointment.horario_final);

    return start < appointmentEnd && end > appointmentStart;
  });
}

function hasBlockedConflict(blockedSlots, input) {
  const start = timeToMinutes(input.horario_inicial);
  const end = timeToMinutes(input.horario_final);

  return blockedSlots.some((slot) => {
    if (slot.data !== input.data) {
      return false;
    }

    if (slot.professional_id && input.profissional_id && slot.professional_id !== input.profissional_id) {
      return false;
    }

    if (slot.professional_id && !input.profissional_id) {
      return false;
    }

    const blockedStart = timeToMinutes(slot.horario_inicial);
    const blockedEnd = timeToMinutes(slot.horario_final);

    return start < blockedEnd && end > blockedStart;
  });
}

function addDaysToDate(date, amount) {
  const value = new Date(`${date}T12:00:00`);
  value.setDate(value.getDate() + amount);
  return value.toISOString().slice(0, 10);
}

function addMonthsToDate(date, amount) {
  const value = new Date(`${date}T12:00:00`);
  value.setMonth(value.getMonth() + amount);
  return value.toISOString().slice(0, 10);
}

function isDateBeforeOrEqual(leftDate, rightDate) {
  return new Date(`${leftDate}T12:00:00`).getTime() <= new Date(`${rightDate}T12:00:00`).getTime();
}

function normalizeRecurrence(input) {
  const recurrence = input.recurrence ?? null;

  if (!recurrence) {
    return { type: "none", count: 1, monthsWindow: 0 };
  }

  const type = recurrence.type ?? "none";
  const count = Number(recurrence.count ?? 1);

  if (!VALID_RECURRENCE_TYPES.includes(type)) {
    throw buildError("Recorrencia invalida.", 400);
  }

  if (!Number.isInteger(count) || count < 1 || count > 12) {
    throw buildError("Quantidade de repeticoes invalida.", 400);
  }

  return { type, count, monthsWindow: type === "none" ? 0 : 6 };
}

function buildRecurrenceDates(baseDate, recurrence) {
  if (recurrence.type === "none") {
    return [baseDate];
  }

  const dates = [];
  const limitDate = addMonthsToDate(baseDate, recurrence.monthsWindow);
  let index = 0;

  while (true) {
    const occurrenceDate =
      recurrence.type === "weekly"
        ? addDaysToDate(baseDate, index * 7)
        : recurrence.type === "biweekly"
          ? addDaysToDate(baseDate, index * 15)
          : addMonthsToDate(baseDate, index);

    if (!isDateBeforeOrEqual(occurrenceDate, limitDate)) {
      break;
    }

    dates.push(occurrenceDate);
    index += 1;
  }

  return dates;
}

function normalizeDeleteScope(scope) {
  const normalized = normalizeString(scope) || "single";

  if (!VALID_DELETE_SCOPES.includes(normalized)) {
    throw buildError("Escopo de exclusao invalido.", 400);
  }

  return normalized;
}

function buildPayload({ client, service, professional, input }) {
  return {
    cliente_id: client.id,
    cliente_nome: client.nome,
    cliente_email: client.email ?? null,
    servico_id: service.id,
    servico_nome: service.nome,
    servico_cor: normalizeServiceColor(service.cor),
    profissional_id: professional?.id ?? null,
    profissional_nome: professional?.nome ?? null,
    data: input.data,
    horario_inicial: input.horario_inicial,
    horario_final: input.horario_final,
    valor: input.valor === undefined ? service.valor_padrao : Number(input.valor),
    status: input.status ?? "pendente",
    payment_status: input.payment_status ?? "pendente",
    observacoes: input.observacoes ?? "",
    confirmacao_cliente: input.confirmacao_cliente ?? "pendente",
    lembrete_enviado: input.lembrete_enviado ?? false,
    lembrete_confirmado: input.lembrete_confirmado ?? false,
    lembrete_cancelado: input.lembrete_cancelado ?? false,
    data_envio_lembrete: input.data_envio_lembrete ?? null,
    resposta_whatsapp: input.resposta_whatsapp ?? null,
    quote_id: input.quote_id ?? null,
    service_order_id: input.service_order_id ?? null,
    recurrence_series_id: input.recurrence_series_id ?? null,
    recurrence_type: input.recurrence_type ?? "none",
    recurrence_index: Number(input.recurrence_index ?? 0),
  };
}

async function validateAppointmentInput({ organizationId, input, appointmentId }) {
  const clientId = normalizeString(input.cliente_id);
  const serviceId = normalizeString(input.servico_id);
  const professionalId = normalizeString(input.profissional_id ?? input.professional_id);
  const quoteId = normalizeString(input.quote_id ?? input.quoteId);
  const serviceOrderId = normalizeString(input.service_order_id ?? input.serviceOrderId);
  const data = normalizeString(input.data);
  const start = normalizeString(input.horario_inicial);
  const end = normalizeString(input.horario_final);

  if (!clientId) {
    throw buildError("Cliente e obrigatorio.", 400);
  }

  if (!serviceId) {
    throw buildError("Servico e obrigatorio.", 400);
  }

  if (!data || !isValidDate(data)) {
    throw buildError("Data obrigatoria e invalida.", 400);
  }

  if (isPastDate(data)) {
    throw buildError("Nao e permitido agendar em data passada.", 400);
  }

  if (!start || !isValidTime(start)) {
    throw buildError("Horario inicial obrigatorio e invalido.", 400);
  }

  if (!end || !isValidTime(end)) {
    throw buildError("Horario final obrigatorio e invalido.", 400);
  }

  if (timeToMinutes(end) <= timeToMinutes(start)) {
    throw buildError("Horario final deve ser maior que o horario inicial.", 400);
  }

  if (input.status && !VALID_STATUS.includes(input.status)) {
    throw buildError("Status invalido.", 400);
  }

  if (input.payment_status && !VALID_PAYMENT_STATUS.includes(input.payment_status)) {
    throw buildError("Status de pagamento invalido.", 400);
  }

  if (input.confirmacao_cliente && !VALID_CONFIRMATION.includes(input.confirmacao_cliente)) {
    throw buildError("Confirmacao do cliente invalida.", 400);
  }

  const client = await getClientByIdForOrganization(organizationId, clientId);

  if (!client) {
    throw buildError("Cliente nao encontrado.", 404);
  }

  const service = await getServiceByIdForOrganization(organizationId, serviceId);

  if (!service) {
    throw buildError("Servico nao encontrado.", 404);
  }

  const serviceProfessionals = await listProfessionalsByService(organizationId, serviceId);
  let professional = null;

  if (serviceProfessionals.length === 1 && !professionalId) {
    professional = serviceProfessionals[0];
  } else if (professionalId) {
    professional = await getProfessionalByIdForOrganization(organizationId, professionalId);

    if (!professional || !professional.ativo) {
      throw buildError("Funcionario nao encontrado ou inativo.", 404);
    }

    const isAllowedForService = serviceProfessionals.some(
      (serviceProfessional) => serviceProfessional.id === professional.id,
    );

    if (serviceProfessionals.length > 0 && !isAllowedForService) {
      throw buildError("O funcionario selecionado nao atende esse servico.", 400);
    }
  } else if (serviceProfessionals.length > 1) {
    throw buildError("Selecione o profissional responsavel por esse atendimento.", 400);
  }

  const settings = await getAppSettingsByOrganization(organizationId);
  const allowConflict = settings?.permitir_conflito ?? false;
  const existingAppointments = await listAppointmentsByOrganization(organizationId, {
    date: data,
    view: "day",
  });
  const blockedSlots = await listBlockedSlotsByOrganization(organizationId, {
    date: data,
    view: "day",
    professionalId: professional?.id ?? professionalId ?? null,
  });

  if (
    !allowConflict &&
    hasConflict(
      existingAppointments,
      {
        data,
        horario_inicial: start,
        horario_final: end,
        profissional_id: professional?.id ?? professionalId ?? null,
      },
      appointmentId,
    )
  ) {
    throw buildError("Ja existe outro agendamento nesse horario.", 409);
  }

  if (
    hasBlockedConflict(blockedSlots, {
      data,
      horario_inicial: start,
      horario_final: end,
      profissional_id: professional?.id ?? professionalId ?? null,
    })
  ) {
    throw buildError("Existe um bloqueio de horario nesse periodo.", 409);
  }

  return {
    client,
    service,
    payload: buildPayload({
      client,
      service,
      professional,
      input: {
        ...input,
        data,
        horario_inicial: start,
        horario_final: end,
        quote_id: quoteId || null,
        service_order_id: serviceOrderId || null,
      },
    }),
  };
}

export async function listAppointments({ organizationId, date, view, professionalId }) {
  await autoCancelStaleAppointmentsForOrganization(organizationId);
  return listAppointmentsByOrganization(organizationId, { date, view, professionalId });
}

export async function listUpcomingAppointments({ organizationId, daysAhead, professionalId }) {
  await autoCancelStaleAppointmentsForOrganization(organizationId);
  const normalizedDaysAhead = Number(daysAhead ?? 45);

  if (!Number.isFinite(normalizedDaysAhead) || normalizedDaysAhead < 1 || normalizedDaysAhead > 90) {
    throw buildError("Janela de busca de lembretes invalida.", 400);
  }

  return listUpcomingAppointmentsByOrganization(organizationId, {
    daysAhead: normalizedDaysAhead,
    professionalId,
  });
}

export async function getAppointment({ organizationId, appointmentId }) {
  await autoCancelStaleAppointmentsForOrganization(organizationId);
  const appointment = await getAppointmentByIdForOrganization(organizationId, appointmentId);

  if (!appointment) {
    throw buildError("Agendamento nao encontrado.", 404);
  }

  return appointment;
}

export async function createAppointment({ organizationId, input }) {
  const recurrence = normalizeRecurrence(input);
  const occurrenceDates = buildRecurrenceDates(input.data, recurrence);
  const createdAppointments = [];
  const recurrenceSeriesId = recurrence.type === "none" ? null : randomUUID();

  for (let index = 0; index < occurrenceDates.length; index += 1) {
    const occurrenceDate = occurrenceDates[index];
    const occurrenceInput = {
      ...input,
      data: occurrenceDate,
    };
    const { payload } = await validateAppointmentInput({ organizationId, input: occurrenceInput });
    const created = await createAppointmentForOrganization(organizationId, {
      ...payload,
      recurrence_series_id: recurrenceSeriesId,
      recurrence_type: recurrence.type,
      recurrence_index: index,
    });
    if (payload.quote_id) {
      await linkQuoteToAppointment({
        organizationId,
        quoteId: payload.quote_id,
        appointmentId: created.id,
      });
    }
    createdAppointments.push(created);
  }

  return {
    appointment: createdAppointments[0],
    createdCount: createdAppointments.length,
    appointments: createdAppointments,
  };
}

export async function updateAppointment({ organizationId, appointmentId, input }) {
  const current = await getAppointmentByIdForOrganization(organizationId, appointmentId);

  if (!current) {
    throw buildError("Agendamento nao encontrado.", 404);
  }

  const mergedInput = {
    ...current,
    ...input,
    cliente_id: input.cliente_id ?? current.cliente_id,
    servico_id: input.servico_id ?? current.servico_id,
    profissional_id: input.profissional_id ?? current.profissional_id,
    data: input.data ?? current.data,
    horario_inicial: input.horario_inicial ?? current.horario_inicial,
    horario_final: input.horario_final ?? current.horario_final,
  };

  const reminderScheduleChanged =
    mergedInput.data !== current.data ||
    mergedInput.horario_inicial !== current.horario_inicial ||
    mergedInput.horario_final !== current.horario_final;

  if (reminderScheduleChanged) {
    mergedInput.lembrete_enviado = false;
    mergedInput.lembrete_confirmado = false;
    mergedInput.lembrete_cancelado = false;
    mergedInput.data_envio_lembrete = null;
    mergedInput.resposta_whatsapp = null;
    mergedInput.confirmacao_cliente = "pendente";
  }

  const { payload } = await validateAppointmentInput({
    organizationId,
    input: mergedInput,
    appointmentId,
  });
  const updated = await updateAppointmentForOrganization(organizationId, appointmentId, payload);

  if (payload.quote_id) {
    await linkQuoteToAppointment({
      organizationId,
      quoteId: payload.quote_id,
      appointmentId,
    });
  }

  if (!updated) {
    throw buildError("Agendamento nao encontrado.", 404);
  }

  return updated;
}

export async function updateAppointmentStatus({ organizationId, appointmentId, status }) {
  if (!VALID_STATUS.includes(status)) {
    throw buildError("Status invalido.", 400);
  }

  const updated = await updateAppointmentForOrganization(organizationId, appointmentId, { status });

  if (!updated) {
    throw buildError("Agendamento nao encontrado.", 404);
  }

  return updated;
}

export async function updateAppointmentPaymentStatus({
  organizationId,
  appointmentId,
  paymentStatus,
}) {
  if (!VALID_PAYMENT_STATUS.includes(paymentStatus)) {
    throw buildError("Status de pagamento invalido.", 400);
  }

  const updated = await updateAppointmentForOrganization(organizationId, appointmentId, {
    payment_status: paymentStatus,
    status: paymentStatus === "pago" ? "concluido" : "pendente",
  });

  if (!updated) {
    throw buildError("Agendamento nao encontrado.", 404);
  }

  return updated;
}

export async function removeAppointment({ organizationId, appointmentId, scope = "single" }) {
  const current = await getAppointmentByIdForOrganization(organizationId, appointmentId);

  if (!current) {
    throw buildError("Agendamento nao encontrado.", 404);
  }

  const deleteScope = normalizeDeleteScope(scope);
  const shouldDeleteSeries =
    deleteScope === "series" &&
    current.recurrence_series_id &&
    current.recurrence_type &&
    current.recurrence_type !== "none";

  const removed = shouldDeleteSeries
    ? await removeAppointmentSeriesForOrganization(organizationId, current.recurrence_series_id)
    : await removeAppointmentForOrganization(organizationId, appointmentId);

  if (!removed) {
    throw buildError("Agendamento nao encontrado.", 404);
  }
}
