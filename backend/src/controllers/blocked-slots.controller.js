import { getRequestActiveAuthContext } from "../lib/request-auth.js";
import {
  createBlockedSlot,
  deleteBlockedSlot,
  listBlockedSlots,
} from "../services/blocked-slot.service.js";

function sendError(response, error) {
  response.status(error.statusCode ?? 500).json({
    message: error.message ?? "Erro inesperado ao processar bloqueios de horario.",
  });
}

export async function listBlockedSlotsController(request, response) {
  try {
    const { organization } = await getRequestActiveAuthContext(request);
    const data = await listBlockedSlots({
      organizationId: organization.id,
      date: request.query.date,
      view: request.query.view,
      professionalId: request.query.professionalId ?? request.query.professional_id,
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

export async function createBlockedSlotController(request, response) {
  try {
    const { organization } = await getRequestActiveAuthContext(request);
    const data = await createBlockedSlot({
      organizationId: organization.id,
      input: request.body ?? {},
    });

    response.status(201).json({
      data,
      message: "Bloqueio criado com sucesso.",
    });
  } catch (error) {
    sendError(response, error);
  }
}

export async function deleteBlockedSlotController(request, response) {
  try {
    const { organization } = await getRequestActiveAuthContext(request);
    await deleteBlockedSlot({
      organizationId: organization.id,
      blockedSlotId: request.params.blockedSlotId,
    });

    response.status(204).send();
  } catch (error) {
    sendError(response, error);
  }
}
