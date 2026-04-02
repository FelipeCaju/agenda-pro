import { processAsaasWebhook } from "../services/billing.service.js";

function sendError(response, error) {
  response.status(error.statusCode ?? 500).json({
    message: error.message ?? "Erro inesperado ao processar webhook.",
  });
}

export async function receiveAsaasWebhookController(request, response) {
  try {
    const data = await processAsaasWebhook({
      rawBody: request.rawBody ?? "",
      headers: request.headers ?? {},
      payload: request.body ?? {},
    });

    response.json({
      data,
      message: "Webhook processado com sucesso.",
    });
  } catch (error) {
    sendError(response, error);
  }
}
