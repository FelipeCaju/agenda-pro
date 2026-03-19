import { apiClient } from "@/services/apiClient";
import { executeServiceCall } from "@/services/serviceHelpers";

export type Professional = {
  id: string;
  nome: string;
  atividade: string;
  ativo: boolean;
  serviceIds: string[];
};

export type ProfessionalInput = {
  nome: string;
  atividade: string;
  ativo: boolean;
  serviceIds: string[];
};

type ProfessionalApiModel = {
  id: string;
  nome: string;
  atividade: string | null;
  ativo: boolean;
  service_ids: string[];
};

function fromApi(model: ProfessionalApiModel): Professional {
  return {
    id: model.id,
    nome: model.nome,
    atividade: model.atividade ?? "",
    ativo: Boolean(model.ativo),
    serviceIds: model.service_ids ?? [],
  };
}

function toApi(input: ProfessionalInput) {
  return {
    nome: input.nome,
    atividade: input.atividade,
    ativo: input.ativo,
    service_ids: input.serviceIds,
  };
}

export const professionalService = {
  async list() {
    return executeServiceCall(
      async () => {
        const response = await apiClient.get<ProfessionalApiModel[]>(
          "/organizations/current/professionals",
        );
        return (response.data ?? []).map(fromApi);
      },
      {
        errorMessage: "Nao foi possivel carregar os funcionarios.",
      },
    );
  },
  async create(input: ProfessionalInput) {
    return executeServiceCall(
      async () => {
        const response = await apiClient.post<ProfessionalApiModel>(
          "/organizations/current/professionals",
          toApi(input),
        );
        return fromApi(response.data);
      },
      {
        errorMessage: "Nao foi possivel criar o funcionario.",
      },
    );
  },
  async update(professionalId: string, input: ProfessionalInput) {
    return executeServiceCall(
      async () => {
        const response = await apiClient.put<ProfessionalApiModel>(
          `/organizations/current/professionals/${professionalId}`,
          toApi(input),
        );
        return fromApi(response.data);
      },
      {
        errorMessage: "Nao foi possivel atualizar o funcionario.",
      },
    );
  },
};
