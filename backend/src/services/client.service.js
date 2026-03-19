import {
  createClientForOrganization,
  getClientByIdForOrganization,
  listClientsByOrganization,
  removeClientForOrganization,
  updateClientForOrganization,
} from "../lib/data.js";

function buildError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeInput(input = {}) {
  return {
    nome: typeof input.nome === "string" ? input.nome.trim() : "",
    telefone: typeof input.telefone === "string" ? input.telefone.trim() : "",
    email: typeof input.email === "string" ? input.email.trim() : "",
    observacoes: typeof input.observacoes === "string" ? input.observacoes.trim() : "",
    ativo: input.ativo,
  };
}

function validateClientInput(input, { partial = false } = {}) {
  const normalized = normalizeInput(input);

  if (!partial || input.nome !== undefined) {
    if (!normalized.nome) {
      throw buildError("Nome do cliente e obrigatorio.", 400);
    }
  }

  if ((input.email !== undefined || !partial) && normalized.email) {
    if (!EMAIL_REGEX.test(normalized.email)) {
      throw buildError("Email invalido.", 400);
    }
  }

  return normalized;
}

export async function listClients({ organizationId, search }) {
  return listClientsByOrganization(organizationId, search);
}

export async function getClient({ organizationId, clientId }) {
  const client = await getClientByIdForOrganization(organizationId, clientId);

  if (!client) {
    throw buildError("Cliente nao encontrado.", 404);
  }

  return client;
}

export async function createClient({ organizationId, input }) {
  const normalized = validateClientInput(input);
  return createClientForOrganization(organizationId, normalized);
}

export async function updateClient({ organizationId, clientId, input }) {
  const normalized = validateClientInput(input, { partial: true });
  const updated = await updateClientForOrganization(organizationId, clientId, normalized);

  if (!updated) {
    throw buildError("Cliente nao encontrado.", 404);
  }

  return updated;
}

export async function toggleClientActive({ organizationId, clientId, ativo }) {
  const updated = await updateClientForOrganization(organizationId, clientId, {
    ativo: Boolean(ativo),
  });

  if (!updated) {
    throw buildError("Cliente nao encontrado.", 404);
  }

  return updated;
}

export async function removeClient({ organizationId, clientId }) {
  const removed = await removeClientForOrganization(organizationId, clientId);

  if (!removed) {
    throw buildError("Cliente nao encontrado.", 404);
  }
}
