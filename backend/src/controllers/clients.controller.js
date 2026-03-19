import { getRequestAuthContext } from "../lib/request-auth.js";
import {
  createClient,
  getClient,
  listClients,
  removeClient,
  toggleClientActive,
  updateClient,
} from "../services/client.service.js";

function sendError(response, error) {
  response.status(error.statusCode ?? 500).json({
    message: error.message ?? "Erro inesperado ao processar clientes.",
  });
}

export async function listClientsController(request, response) {
  try {
    const { organization } = await getRequestAuthContext(request);
    const clients = await listClients({
      organizationId: organization.id,
      search: request.query.search ?? request.query.q ?? "",
    });

    response.json({
      data: clients,
      meta: {
        total: clients.length,
      },
    });
  } catch (error) {
    sendError(response, error);
  }
}

export async function getClientController(request, response) {
  try {
    const { organization } = await getRequestAuthContext(request);
    const client = await getClient({
      organizationId: organization.id,
      clientId: request.params.clientId,
    });

    response.json({
      data: client,
    });
  } catch (error) {
    sendError(response, error);
  }
}

export async function createClientController(request, response) {
  try {
    const { organization } = await getRequestAuthContext(request);
    const client = await createClient({
      organizationId: organization.id,
      input: request.body,
    });

    response.status(201).json({
      data: client,
      message: "Cliente criado com sucesso.",
    });
  } catch (error) {
    sendError(response, error);
  }
}

export async function updateClientController(request, response) {
  try {
    const { organization } = await getRequestAuthContext(request);
    const client = await updateClient({
      organizationId: organization.id,
      clientId: request.params.clientId,
      input: request.body,
    });

    response.json({
      data: client,
      message: "Cliente atualizado com sucesso.",
    });
  } catch (error) {
    sendError(response, error);
  }
}

export async function toggleClientActiveController(request, response) {
  try {
    const { organization } = await getRequestAuthContext(request);
    const client = await toggleClientActive({
      organizationId: organization.id,
      clientId: request.params.clientId,
      ativo: request.body?.ativo,
    });

    response.json({
      data: client,
      message: client.ativo ? "Cliente ativado com sucesso." : "Cliente inativado com sucesso.",
    });
  } catch (error) {
    sendError(response, error);
  }
}

export async function deleteClientController(request, response) {
  try {
    const { organization } = await getRequestAuthContext(request);
    await removeClient({
      organizationId: organization.id,
      clientId: request.params.clientId,
    });

    response.status(204).send();
  } catch (error) {
    sendError(response, error);
  }
}
