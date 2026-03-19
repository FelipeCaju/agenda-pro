import { getRequestAuthContext } from "../lib/request-auth.js";
import { getSettings, updateSettings } from "../services/settings.service.js";

function sendError(response, error) {
  response.status(error.statusCode ?? 500).json({
    message: error.message ?? "Erro inesperado ao processar configuracoes.",
  });
}

export async function getSettingsController(request, response) {
  try {
    const { organization } = await getRequestAuthContext(request);
    const data = await getSettings({
      organizationId: organization.id,
    });

    response.json({ data });
  } catch (error) {
    sendError(response, error);
  }
}

export async function updateSettingsController(request, response) {
  try {
    const { organization } = await getRequestAuthContext(request);
    const data = await updateSettings({
      organizationId: organization.id,
      input: request.body ?? {},
    });

    response.json({
      data,
      message: "Configuracoes atualizadas com sucesso.",
    });
  } catch (error) {
    sendError(response, error);
  }
}
