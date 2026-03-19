import { getRequestAuthContext } from "../lib/request-auth.js";
import {
  getCurrentOrganization,
  listCurrentOrganizationPayments,
  listOrganizationMembers,
  updateCurrentOrganization,
} from "../services/organization.service.js";

function sendError(response, error) {
  response.status(error.statusCode ?? 500).json({
    message: error.message ?? "Erro inesperado ao processar organizacao.",
  });
}

export async function getCurrentOrganizationController(request, response) {
  try {
    const { organization } = await getRequestAuthContext(request);
    const data = await getCurrentOrganization({
      organizationId: organization.id,
    });

    response.json({ data });
  } catch (error) {
    sendError(response, error);
  }
}

export async function listOrganizationMembersController(request, response) {
  try {
    const { organization } = await getRequestAuthContext(request);
    const data = await listOrganizationMembers({
      organizationId: organization.id,
    });

    response.json({
      data,
      meta: {
        total: data.length,
      },
    });
  } catch (error) {
    sendError(response, error);
  }
}

export async function listCurrentOrganizationPaymentsController(request, response) {
  try {
    const { organization } = await getRequestAuthContext(request);
    const data = await listCurrentOrganizationPayments({
      organizationId: organization.id,
    });

    response.json({
      data,
      meta: {
        total: data.length,
      },
    });
  } catch (error) {
    sendError(response, error);
  }
}

export async function updateCurrentOrganizationController(request, response) {
  try {
    const { organization } = await getRequestAuthContext(request);
    const data = await updateCurrentOrganization({
      organizationId: organization.id,
      input: request.body ?? {},
    });

    response.json({
      data,
      message: "Organizacao atualizada com sucesso.",
    });
  } catch (error) {
    sendError(response, error);
  }
}
