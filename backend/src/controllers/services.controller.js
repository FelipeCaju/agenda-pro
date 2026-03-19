import { getRequestAuthContext } from "../lib/request-auth.js";
import {
  createBusinessService,
  getBusinessService,
  listBusinessServices,
  removeBusinessService,
  toggleBusinessServiceActive,
  updateBusinessService,
} from "../services/business-service.service.js";

function sendError(response, error) {
  response.status(error.statusCode ?? 500).json({
    message: error.message ?? "Erro inesperado ao processar servicos.",
  });
}

export async function listServicesController(request, response) {
  try {
    const { organization } = await getRequestAuthContext(request);
    const services = await listBusinessServices({
      organizationId: organization.id,
      search: request.query.search ?? request.query.q ?? "",
    });

    response.json({
      data: services,
      meta: {
        total: services.length,
      },
    });
  } catch (error) {
    sendError(response, error);
  }
}

export async function getServiceController(request, response) {
  try {
    const { organization } = await getRequestAuthContext(request);
    const service = await getBusinessService({
      organizationId: organization.id,
      serviceId: request.params.serviceId,
    });

    response.json({
      data: service,
    });
  } catch (error) {
    sendError(response, error);
  }
}

export async function createServiceController(request, response) {
  try {
    const { organization } = await getRequestAuthContext(request);
    const service = await createBusinessService({
      organizationId: organization.id,
      input: request.body,
    });

    response.status(201).json({
      data: service,
      message: "Servico criado com sucesso.",
    });
  } catch (error) {
    sendError(response, error);
  }
}

export async function updateServiceController(request, response) {
  try {
    const { organization } = await getRequestAuthContext(request);
    const service = await updateBusinessService({
      organizationId: organization.id,
      serviceId: request.params.serviceId,
      input: request.body,
    });

    response.json({
      data: service,
      message: "Servico atualizado com sucesso.",
    });
  } catch (error) {
    sendError(response, error);
  }
}

export async function toggleServiceActiveController(request, response) {
  try {
    const { organization } = await getRequestAuthContext(request);
    const service = await toggleBusinessServiceActive({
      organizationId: organization.id,
      serviceId: request.params.serviceId,
      ativo: request.body?.ativo,
    });

    response.json({
      data: service,
      message: service.ativo ? "Servico ativado com sucesso." : "Servico inativado com sucesso.",
    });
  } catch (error) {
    sendError(response, error);
  }
}

export async function deleteServiceController(request, response) {
  try {
    const { organization } = await getRequestAuthContext(request);
    await removeBusinessService({
      organizationId: organization.id,
      serviceId: request.params.serviceId,
    });

    response.status(204).send();
  } catch (error) {
    sendError(response, error);
  }
}
