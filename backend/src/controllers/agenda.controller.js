import { getRequestActiveAuthContext } from "../lib/request-auth.js";
import {
  createAppointment,
  getAppointment,
  listAppointments,
  removeAppointment,
  updateAppointment,
  updateAppointmentPaymentStatus,
  updateAppointmentStatus,
} from "../services/appointment.service.js";

function sendError(response, error) {
  response.status(error.statusCode ?? 500).json({
    message: error.message ?? "Erro inesperado ao processar agenda.",
  });
}

export async function listAgendaController(request, response) {
  try {
    const { organization } = await getRequestActiveAuthContext(request);
    const appointments = await listAppointments({
      organizationId: organization.id,
      date: request.query.date,
      view: request.query.view,
      professionalId: request.query.professionalId ?? request.query.professional_id,
    });

    response.json({
      data: appointments,
      meta: {
        total: appointments.length,
      },
    });
  } catch (error) {
    sendError(response, error);
  }
}

export async function getAppointmentController(request, response) {
  try {
    const { organization } = await getRequestActiveAuthContext(request);
    const appointment = await getAppointment({
      organizationId: organization.id,
      appointmentId: request.params.appointmentId,
    });

    response.json({
      data: appointment,
    });
  } catch (error) {
    sendError(response, error);
  }
}

export async function createAppointmentController(request, response) {
  try {
    const { organization } = await getRequestActiveAuthContext(request);
    const result = await createAppointment({
      organizationId: organization.id,
      input: request.body,
    });

    response.status(201).json({
      data: result.appointment,
      meta: {
        createdCount: result.createdCount,
      },
      message:
        result.createdCount > 1
          ? `${result.createdCount} agendamentos criados com sucesso.`
          : "Agendamento criado com sucesso.",
    });
  } catch (error) {
    sendError(response, error);
  }
}

export async function updateAppointmentController(request, response) {
  try {
    const { organization } = await getRequestActiveAuthContext(request);
    const appointment = await updateAppointment({
      organizationId: organization.id,
      appointmentId: request.params.appointmentId,
      input: request.body,
    });

    response.json({
      data: appointment,
      message: "Agendamento atualizado com sucesso.",
    });
  } catch (error) {
    sendError(response, error);
  }
}

export async function updateAppointmentStatusController(request, response) {
  try {
    const { organization } = await getRequestActiveAuthContext(request);
    const appointment = await updateAppointmentStatus({
      organizationId: organization.id,
      appointmentId: request.params.appointmentId,
      status: request.body?.status,
    });

    response.json({
      data: appointment,
      message: "Status atualizado com sucesso.",
    });
  } catch (error) {
    sendError(response, error);
  }
}

export async function updateAppointmentPaymentStatusController(request, response) {
  try {
    const { organization } = await getRequestActiveAuthContext(request);
    const appointment = await updateAppointmentPaymentStatus({
      organizationId: organization.id,
      appointmentId: request.params.appointmentId,
      paymentStatus: request.body?.paymentStatus ?? request.body?.payment_status,
    });

    response.json({
      data: appointment,
      message: "Status de pagamento atualizado com sucesso.",
    });
  } catch (error) {
    sendError(response, error);
  }
}

export async function deleteAppointmentController(request, response) {
  try {
    const { organization } = await getRequestActiveAuthContext(request);
    await removeAppointment({
      organizationId: organization.id,
      appointmentId: request.params.appointmentId,
    });

    response.status(204).send();
  } catch (error) {
    sendError(response, error);
  }
}
