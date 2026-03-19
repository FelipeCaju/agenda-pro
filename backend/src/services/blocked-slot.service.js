import {
  createBlockedSlotForOrganization,
  getProfessionalByIdForOrganization,
  listBlockedSlotsByOrganization,
  removeBlockedSlotForOrganization,
} from "../lib/data.js";

function buildError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function normalizeString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function isValidDate(date) {
  return /^\d{4}-\d{2}-\d{2}$/.test(date);
}

function isValidTime(time) {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(time);
}

function timeToMinutes(time) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

export async function listBlockedSlots({ organizationId, date, view, professionalId }) {
  return listBlockedSlotsByOrganization(organizationId, { date, view, professionalId });
}

export async function createBlockedSlot({ organizationId, input }) {
  const data = normalizeString(input.data);
  const horarioInicial = normalizeString(input.horario_inicial ?? input.horarioInicial);
  const horarioFinal = normalizeString(input.horario_final ?? input.horarioFinal);
  const professionalId = normalizeString(input.professional_id ?? input.professionalId);
  const motivo = normalizeString(input.motivo);

  if (!isValidDate(data)) {
    throw buildError("Data do bloqueio invalida.", 400);
  }

  if (!isValidTime(horarioInicial) || !isValidTime(horarioFinal)) {
    throw buildError("Horario inicial e final do bloqueio sao obrigatorios.", 400);
  }

  if (timeToMinutes(horarioFinal) <= timeToMinutes(horarioInicial)) {
    throw buildError("O horario final do bloqueio deve ser maior que o inicial.", 400);
  }

  if (professionalId) {
    const professional = await getProfessionalByIdForOrganization(organizationId, professionalId);

    if (!professional) {
      throw buildError("Funcionario do bloqueio nao encontrado.", 404);
    }
  }

  return createBlockedSlotForOrganization(organizationId, {
    professional_id: professionalId || null,
    data,
    horario_inicial: horarioInicial,
    horario_final: horarioFinal,
    motivo,
  });
}

export async function deleteBlockedSlot({ organizationId, blockedSlotId }) {
  const removed = await removeBlockedSlotForOrganization(organizationId, blockedSlotId);

  if (!removed) {
    throw buildError("Bloqueio nao encontrado.", 404);
  }

  return { success: true };
}
