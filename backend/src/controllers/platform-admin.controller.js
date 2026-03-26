import {
  createOrganizationForPlatformAdmin,
  createPaymentForPlatformAdmin,
  getOrganizationForPlatformAdmin,
  getPlatformSettingsForAdmin,
  listOrganizationsForPlatformAdmin,
  listPaymentsForPlatformAdmin,
  updatePlatformSettingsForAdmin,
  updateOrganizationSubscriptionForPlatformAdmin,
} from "../services/platform-admin.service.js";

function sendError(response, error) {
  response.status(error.statusCode ?? 500).json({
    message: error.message ?? "Erro inesperado ao processar Super Admin.",
  });
}

export async function listAdminOrganizationsController(_request, response) {
  try {
    response.json({ data: await listOrganizationsForPlatformAdmin() });
  } catch (error) {
    sendError(response, error);
  }
}

export async function createAdminOrganizationController(request, response) {
  try {
    response.status(201).json({
      data: await createOrganizationForPlatformAdmin(request.body ?? {}),
      message: "Empresa criada com sucesso.",
    });
  } catch (error) {
    sendError(response, error);
  }
}

export async function getAdminOrganizationController(request, response) {
  try {
    response.json({
      data: await getOrganizationForPlatformAdmin(request.params.organizationId),
    });
  } catch (error) {
    sendError(response, error);
  }
}

export async function updateAdminOrganizationSubscriptionController(request, response) {
  try {
    response.json({
      data: await updateOrganizationSubscriptionForPlatformAdmin(
        request.params.organizationId,
        request.body ?? {},
      ),
      message: "Assinatura da organizacao atualizada com sucesso.",
    });
  } catch (error) {
    sendError(response, error);
  }
}

export async function listAdminOrganizationPaymentsController(request, response) {
  try {
    response.json({
      data: await listPaymentsForPlatformAdmin(request.params.organizationId),
    });
  } catch (error) {
    sendError(response, error);
  }
}

export async function createAdminOrganizationPaymentController(request, response) {
  try {
    response.status(201).json({
      data: await createPaymentForPlatformAdmin(
        request.params.organizationId,
        request.body ?? {},
      ),
      message: "Pagamento registrado com sucesso.",
    });
  } catch (error) {
    sendError(response, error);
  }
}

export async function getPlatformSettingsController(_request, response) {
  try {
    response.json({
      data: await getPlatformSettingsForAdmin(),
    });
  } catch (error) {
    sendError(response, error);
  }
}

export async function updatePlatformSettingsController(request, response) {
  try {
    response.json({
      data: await updatePlatformSettingsForAdmin(request.body ?? {}),
      message: "Configuracoes da plataforma atualizadas com sucesso.",
    });
  } catch (error) {
    sendError(response, error);
  }
}
