import { getRequestAuthContext } from "../lib/request-auth.js";
import {
  createProfessional,
  getProfessional,
  listProfessionals,
  updateProfessional,
} from "../services/professional.service.js";

function sendError(response, error) {
  response.status(error.statusCode ?? 500).json({
    message: error.message ?? "Erro inesperado ao processar funcionarios.",
  });
}

export async function listProfessionalsController(request, response) {
  try {
    const { organization } = await getRequestAuthContext(request);
    const data = await listProfessionals({ organizationId: organization.id });

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

export async function getProfessionalController(request, response) {
  try {
    const { organization } = await getRequestAuthContext(request);
    const data = await getProfessional({
      organizationId: organization.id,
      professionalId: request.params.professionalId,
    });

    response.json({ data });
  } catch (error) {
    sendError(response, error);
  }
}

export async function createProfessionalController(request, response) {
  try {
    const { organization } = await getRequestAuthContext(request);
    const data = await createProfessional({
      organizationId: organization.id,
      input: request.body ?? {},
    });

    response.status(201).json({
      data,
      message: "Funcionario criado com sucesso.",
    });
  } catch (error) {
    sendError(response, error);
  }
}

export async function updateProfessionalController(request, response) {
  try {
    const { organization } = await getRequestAuthContext(request);
    const data = await updateProfessional({
      organizationId: organization.id,
      professionalId: request.params.professionalId,
      input: request.body ?? {},
    });

    response.json({
      data,
      message: "Funcionario atualizado com sucesso.",
    });
  } catch (error) {
    sendError(response, error);
  }
}
