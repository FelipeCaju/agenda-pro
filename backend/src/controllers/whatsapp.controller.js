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
    body?.senderPhone ??
    body?.data?.phone ??
    body?.data?.from ??
    body?.message?.phone ??
    body?.message?.from ??
    ""
  );
}

function readIncomingMessage(body) {
  return (
    body?.message ??
    body?.text ??
    body?.body ??
    body?.data?.text ??
    body?.data?.body ??
    body?.message?.text ??
    body?.message?.body ??
    ""
  );
}

export async function receiveWhatsappWebhookController(request, response) {
  try {
    const data = await processIncomingWhatsappReply({
      phone: readIncomingPhone(request.body ?? {}),
      message: readIncomingMessage(request.body ?? {}),
    });

    response.json({ data });
  } catch (error) {
    sendError(response, error);
  }
}
