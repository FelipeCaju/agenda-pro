import {
  createProfessionalForOrganization,
  getProfessionalByIdForOrganization,
  getServiceByIdForOrganization,
  listProfessionalsByOrganization,
  listServiceIdsByProfessional,
  updateProfessionalForOrganization,
} from "../lib/data.js";

function normalizeString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeServiceIds(serviceIds) {
  if (!Array.isArray(serviceIds)) {
    return [];
  }

  return [...new Set(serviceIds.map((value) => normalizeString(value)).filter(Boolean))];
}

async function assertServicesExist(organizationId, serviceIds) {
  for (const serviceId of serviceIds) {
    const service = await getServiceByIdForOrganization(organizationId, serviceId);

    if (!service) {
      const error = new Error("Servico vinculado ao funcionario nao encontrado.");
      error.statusCode = 404;
      throw error;
    }
  }
}

async function buildProfessionalPayload(professional) {
  const serviceIds = await listServiceIdsByProfessional(
    professional.organization_id,
    professional.id,
  );

  return {
    id: professional.id,
    nome: professional.nome,
    atividade: professional.atividade ?? "",
    ativo: Boolean(professional.ativo),
    service_ids: serviceIds,
    created_at: professional.created_at,
    updated_at: professional.updated_at,
  };
}

export async function listProfessionals({ organizationId }) {
  const professionals = await listProfessionalsByOrganization(organizationId);
  return Promise.all(professionals.map((professional) => buildProfessionalPayload(professional)));
}

export async function getProfessional({ organizationId, professionalId }) {
  const professional = await getProfessionalByIdForOrganization(organizationId, professionalId);

  if (!professional) {
    const error = new Error("Funcionario nao encontrado.");
    error.statusCode = 404;
    throw error;
  }

  return buildProfessionalPayload(professional);
}

export async function createProfessional({ organizationId, input }) {
  const nome = normalizeString(input.nome);
  const atividade = normalizeString(input.atividade);
  const serviceIds = normalizeServiceIds(input.service_ids ?? input.serviceIds);

  if (!nome) {
    const error = new Error("Nome do funcionario e obrigatorio.");
    error.statusCode = 400;
    throw error;
  }

  await assertServicesExist(organizationId, serviceIds);

  const professional = await createProfessionalForOrganization(organizationId, {
    nome,
    atividade,
    ativo: input.ativo !== false,
    service_ids: serviceIds,
  });

  return getProfessional({ organizationId, professionalId: professional.id });
}

export async function updateProfessional({ organizationId, professionalId, input }) {
  const current = await getProfessionalByIdForOrganization(organizationId, professionalId);

  if (!current) {
    const error = new Error("Funcionario nao encontrado.");
    error.statusCode = 404;
    throw error;
  }

  const nome = input.nome === undefined ? current.nome : normalizeString(input.nome);
  const atividade =
    input.atividade === undefined ? current.atividade : normalizeString(input.atividade);
  const serviceIds =
    input.service_ids !== undefined || input.serviceIds !== undefined
      ? normalizeServiceIds(input.service_ids ?? input.serviceIds)
      : undefined;

  if (!nome) {
    const error = new Error("Nome do funcionario e obrigatorio.");
    error.statusCode = 400;
    throw error;
  }

  if (serviceIds) {
    await assertServicesExist(organizationId, serviceIds);
  }

  await updateProfessionalForOrganization(organizationId, professionalId, {
    nome,
    atividade,
    ativo: input.ativo === undefined ? current.ativo : Boolean(input.ativo),
    service_ids: serviceIds,
  });

  return getProfessional({ organizationId, professionalId });
}
