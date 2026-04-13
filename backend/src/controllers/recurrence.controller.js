import { getRequestActiveAuthContext } from "../lib/request-auth.js";
import {
  cancelRecurringCharge,
  createRecurringProfile,
  deleteRecurringProfile,
  getRecurringCharge,
  getRecurringProfile,
  getRecurringSummary,
  listChargesByRecurringProfile,
  listRecurringCharges,
  listRecurringProfiles,
  markRecurringChargeAsPaid,
  processRecurringAutomation,
  resendRecurringChargeWhatsapp,
  toggleRecurringProfileActive,
  updateRecurringProfile,
} from "../services/recurrence.service.js";

function sendError(response, error) {
  response.status(error.statusCode ?? 500).json({
    message: error.message ?? "Erro inesperado ao processar recorrencia.",
  });
}

export async function listRecurringProfilesController(request, response) {
  try {
    const { organization } = await getRequestActiveAuthContext(request);
    const data = await listRecurringProfiles({
      organizationId: organization.id,
      filters: request.query ?? {},
    });
    response.json({ data, meta: { total: data.length } });
  } catch (error) {
    sendError(response, error);
  }
}

export async function getRecurringProfileController(request, response) {
  try {
    const { organization } = await getRequestActiveAuthContext(request);
    const data = await getRecurringProfile({
      organizationId: organization.id,
      profileId: request.params.profileId,
    });
    response.json({ data });
  } catch (error) {
    sendError(response, error);
  }
}

export async function createRecurringProfileController(request, response) {
  try {
    const { organization, user } = await getRequestActiveAuthContext(request);
    const data = await createRecurringProfile({
      organizationId: organization.id,
      input: request.body ?? {},
      createdByUserId: user.id,
    });
    response.status(201).json({ data, message: "Recorrencia criada com sucesso." });
  } catch (error) {
    sendError(response, error);
  }
}

export async function updateRecurringProfileController(request, response) {
  try {
    const { organization, user } = await getRequestActiveAuthContext(request);
    const data = await updateRecurringProfile({
      organizationId: organization.id,
      profileId: request.params.profileId,
      input: request.body ?? {},
      updatedByUserId: user.id,
    });
    response.json({ data, message: "Recorrencia atualizada com sucesso." });
  } catch (error) {
    sendError(response, error);
  }
}

export async function toggleRecurringProfileActiveController(request, response) {
  try {
    const { organization, user } = await getRequestActiveAuthContext(request);
    const data = await toggleRecurringProfileActive({
      organizationId: organization.id,
      profileId: request.params.profileId,
      ativo: request.body?.ativo,
      updatedByUserId: user.id,
    });
    response.json({
      data,
      message: data.ativo ? "Recorrencia ativada com sucesso." : "Recorrencia inativada com sucesso.",
    });
  } catch (error) {
    sendError(response, error);
  }
}

export async function deleteRecurringProfileController(request, response) {
  try {
    const { organization, user } = await getRequestActiveAuthContext(request);
    await deleteRecurringProfile({
      organizationId: organization.id,
      profileId: request.params.profileId,
      deletedByUserId: user.id,
    });
    response.status(204).send();
  } catch (error) {
    sendError(response, error);
  }
}

export async function listChargesByRecurringProfileController(request, response) {
  try {
    const { organization } = await getRequestActiveAuthContext(request);
    const data = await listChargesByRecurringProfile({
      organizationId: organization.id,
      profileId: request.params.profileId,
    });
    response.json({ data, meta: { total: data.length } });
  } catch (error) {
    sendError(response, error);
  }
}

export async function listRecurringChargesController(request, response) {
  try {
    const { organization } = await getRequestActiveAuthContext(request);
    const data = await listRecurringCharges({
      organizationId: organization.id,
      filters: request.query ?? {},
    });
    response.json({ data, meta: { total: data.length } });
  } catch (error) {
    sendError(response, error);
  }
}

export async function getRecurringChargeController(request, response) {
  try {
    const { organization } = await getRequestActiveAuthContext(request);
    const data = await getRecurringCharge({
      organizationId: organization.id,
      chargeId: request.params.chargeId,
    });
    response.json({ data });
  } catch (error) {
    sendError(response, error);
  }
}

export async function markRecurringChargeAsPaidController(request, response) {
  try {
    const { organization, user } = await getRequestActiveAuthContext(request);
    const data = await markRecurringChargeAsPaid({
      organizationId: organization.id,
      chargeId: request.params.chargeId,
      input: request.body ?? {},
      updatedByUserId: user.id,
    });
    response.json({ data, message: "Cobranca marcada como paga." });
  } catch (error) {
    sendError(response, error);
  }
}

export async function cancelRecurringChargeController(request, response) {
  try {
    const { organization, user } = await getRequestActiveAuthContext(request);
    const data = await cancelRecurringCharge({
      organizationId: organization.id,
      chargeId: request.params.chargeId,
      input: request.body ?? {},
      updatedByUserId: user.id,
    });
    response.json({ data, message: "Cobranca cancelada com sucesso." });
  } catch (error) {
    sendError(response, error);
  }
}

export async function resendRecurringChargeWhatsappController(request, response) {
  try {
    const { organization, user } = await getRequestActiveAuthContext(request);
    const data = await resendRecurringChargeWhatsapp({
      organizationId: organization.id,
      chargeId: request.params.chargeId,
      createdByUserId: user.id,
    });
    response.json({ data, message: "WhatsApp reenviado com sucesso." });
  } catch (error) {
    sendError(response, error);
  }
}

export async function getRecurringSummaryController(request, response) {
  try {
    const { organization } = await getRequestActiveAuthContext(request);
    const data = await getRecurringSummary({
      organizationId: organization.id,
      referenceDate: request.query.referenceDate ?? request.query.reference_date,
    });
    response.json({ data });
  } catch (error) {
    sendError(response, error);
  }
}

export async function runRecurringAutomationController(request, response) {
  try {
    const { organization, user } = await getRequestActiveAuthContext(request);
    const data = await processRecurringAutomation({
      organizationId: organization.id,
      targetDate: request.body?.targetDate ?? request.body?.target_date,
      createdByUserId: user.id,
      sendWhatsapp: request.body?.sendWhatsapp ?? request.body?.send_whatsapp ?? true,
    });
    response.json({ data, message: "Processo diario de recorrencia executado." });
  } catch (error) {
    sendError(response, error);
  }
}
