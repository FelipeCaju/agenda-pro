import { getRequestActiveAuthContext } from "../lib/request-auth.js";
import {
  listOrganizationReminders,
  registerReminderReply,
  sendManualReminder,
} from "../services/reminder.service.js";

function sendError(response, error) {
  response.status(error.statusCode ?? 500).json({
    message: error.message ?? "Erro inesperado ao processar lembretes.",
  });
}

export async function listReminders(request, response) {
  try {
    const { organization } = await getRequestActiveAuthContext(request);
    const data = await listOrganizationReminders({
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

export async function sendManualReminderController(request, response) {
  try {
    const { organization } = await getRequestActiveAuthContext(request);
    const data = await sendManualReminder({
      organizationId: organization.id,
      appointmentId: request.body?.appointmentId,
    });

    response.json({
      data,
      message: "Lembrete enviado com sucesso.",
    });
  } catch (error) {
    sendError(response, error);
  }
}

export async function registerReminderReplyController(request, response) {
  try {
    const { organization } = await getRequestActiveAuthContext(request);
    const data = await registerReminderReply({
      organizationId: organization.id,
      appointmentId: request.params.appointmentId,
      replyStatus: request.body?.replyStatus,
      responseText: request.body?.responseText,
    });

    response.json({
      data,
      message: "Resposta do cliente registrada com sucesso.",
    });
  } catch (error) {
    sendError(response, error);
  }
}
