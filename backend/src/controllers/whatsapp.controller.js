import { getRequestActiveAuthContext, getRequestAuthContext } from "../lib/request-auth.js";
import { processIncomingWhatsappReply } from "../services/reminder.service.js";
import {
  getWhatsappStatus,
  sendWhatsappTestMessage,
} from "../services/whatsapp.service.js";

function sendError(response, error) {
  response.status(error.statusCode ?? 500).json({
    message: error.message ?? "Erro inesperado ao processar WhatsApp.",
  });
}

export async function getWhatsappStatusController(request, response) {
  try {
    const { organization } = await getRequestActiveAuthContext(request);
    const data = await getWhatsappStatus({
      organizationId: organization.id,
    });

    response.json({ data });
  } catch (error) {
    sendError(response, error);
  }
}

export async function sendWhatsappTestMessageController(request, response) {
  try {
    const { organization } = await getRequestActiveAuthContext(request);
    const data = await sendWhatsappTestMessage({
      organizationId: organization.id,
      input: request.body ?? {},
    });

    response.json({
      data,
      message: "Mensagem de teste enviada com sucesso.",
    });
  } catch (error) {
    sendError(response, error);
  }
}

function readIncomingPhone(body) {
  return (
    body?.phone ??
    body?.from ??
    body?.chatId ??
    body?.senderPhone ??
    body?.data?.phone ??
    body?.data?.from ??
    body?.data?.chatId ??
    body?.message?.phone ??
    body?.message?.from ??
    body?.visitor?.phone ??
    body?.text?.phone ??
    ""
  );
}

function validateWebhookSecret(request) {
  const expected = String(process.env.WHATSAPP_WEBHOOK_SECRET ?? "").trim();

  if (!expected) {
    const error = new Error("Webhook do WhatsApp sem chave secreta configurada.");
    error.statusCode = 503;
    throw error;
  }

  const provided = String(
    request.get("x-whatsapp-webhook-secret") ?? request.query?.secret ?? "",
  ).trim();

  if (provided !== expected) {
    const error = new Error("Webhook do WhatsApp nao autorizado.");
    error.statusCode = 401;
    throw error;
  }
}

function readIncomingMessage(body) {
  return (
    body?.message ??
    body?.text ??
    body?.body ??
    body?.text?.message ??
    body?.text?.body ??
    body?.data?.text ??
    body?.data?.body ??
    body?.data?.message ??
    body?.data?.text?.message ??
    body?.message?.text ??
    body?.message?.body ??
    body?.message?.message ??
    ""
  );
}

export async function receiveWhatsappWebhookController(request, response) {
  try {
    validateWebhookSecret(request);
    const data = await processIncomingWhatsappReply({
      phone: readIncomingPhone(request.body ?? {}),
      message: readIncomingMessage(request.body ?? {}),
    });

    response.json({ data });
  } catch (error) {
    sendError(response, error);
  }
}
