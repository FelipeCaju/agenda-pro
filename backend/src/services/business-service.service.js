import {
  createServiceForOrganization,
  getServiceByIdForOrganization,
  listServicesByOrganization,
  removeServiceForOrganization,
  updateServiceForOrganization,
} from "../lib/data.js";

function buildError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

const COLOR_REGEX = /^#([0-9a-fA-F]{6})$/;

function normalizeInput(input = {}) {
  return {
    nome: typeof input.nome === "string" ? input.nome.trim() : "",
    descricao: typeof input.descricao === "string" ? input.descricao.trim() : "",
    duracao_minutos: input.duracao_minutos,
    valor_padrao: input.valor_padrao,
    cor: typeof input.cor === "string" ? input.cor.trim() : "",
    ativo: input.ativo,
  };
}

function validateServiceInput(input, { partial = false } = {}) {
  const normalized = normalizeInput(input);

  if (!partial || input.nome !== undefined) {
    if (!normalized.nome) {
      throw buildError("Nome do servico e obrigatorio.", 400);
    }
  }

  if (!partial || input.duracao_minutos !== undefined) {
    const duration = Number(normalized.duracao_minutos);

    if (!Number.isFinite(duration) || duration <= 0) {
      throw buildError("Duracao deve ser um numero valido maior que zero.", 400);
    }
  }

  if (!partial || input.valor_padrao !== undefined) {
    const value = Number(normalized.valor_padrao);

    if (!Number.isFinite(value) || value < 0) {
      throw buildError("Valor padrao deve ser um numero valido.", 400);
    }
  }

  if ((!partial || input.cor !== undefined) && normalized.cor) {
    if (!COLOR_REGEX.test(normalized.cor)) {
      throw buildError("Cor invalida. Use o formato hexadecimal #RRGGBB.", 400);
    }
  }

  return normalized;
}

export async function listBusinessServices({ organizationId, search }) {
  return listServicesByOrganization(organizationId, search);
}

export async function getBusinessService({ organizationId, serviceId }) {
  const service = await getServiceByIdForOrganization(organizationId, serviceId);

  if (!service) {
    throw buildError("Servico nao encontrado.", 404);
  }

  return service;
}

export async function createBusinessService({ organizationId, input }) {
  const normalized = validateServiceInput(input);
  return createServiceForOrganization(organizationId, normalized);
}

export async function updateBusinessService({ organizationId, serviceId, input }) {
  const normalized = validateServiceInput(input, { partial: true });
  const updated = await updateServiceForOrganization(organizationId, serviceId, normalized);

  if (!updated) {
    throw buildError("Servico nao encontrado.", 404);
  }

  return updated;
}

export async function toggleBusinessServiceActive({ organizationId, serviceId, ativo }) {
  const updated = await updateServiceForOrganization(organizationId, serviceId, {
    ativo: Boolean(ativo),
  });

  if (!updated) {
    throw buildError("Servico nao encontrado.", 404);
  }

  return updated;
}

export async function removeBusinessService({ organizationId, serviceId }) {
  const removed = await removeServiceForOrganization(organizationId, serviceId);

  if (!removed) {
    throw buildError("Servico nao encontrado.", 404);
  }
}
