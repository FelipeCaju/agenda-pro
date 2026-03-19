import { apiClient } from "@/services/apiClient";
import { executeServiceCall } from "@/services/serviceHelpers";

export type BusinessService = {
  id: string;
  organization_id?: string;
  nome: string;
  descricao: string;
  duracaoMinutos: number;
  valorPadrao: number;
  cor: string;
  ativo: boolean;
  created_at?: string;
  updated_at?: string;
};

export type BusinessServiceInput = {
  nome: string;
  descricao?: string;
  duracaoMinutos: number;
  valorPadrao: number;
  cor: string;
  ativo?: boolean;
};

export type BusinessServiceListFilters = {
  search?: string;
};

type ServiceApiModel = {
  id: string;
  organization_id?: string;
  nome: string;
  descricao?: string | null;
  duracao_minutos: number;
  valor_padrao: number;
  cor?: string | null;
  ativo: boolean;
  created_at?: string;
  updated_at?: string;
};

function fromApi(model: ServiceApiModel): BusinessService {
  return {
    id: model.id,
    organization_id: model.organization_id,
    nome: model.nome ?? "",
    descricao: model.descricao ?? "",
    duracaoMinutos: Number(model.duracao_minutos ?? 0),
    valorPadrao: Number(model.valor_padrao ?? 0),
    cor: model.cor ?? "#1d8cf8",
    ativo: Boolean(model.ativo),
    created_at: model.created_at,
    updated_at: model.updated_at,
  };
}

function toApi(input: BusinessServiceInput) {
  return {
    nome: input.nome.trim(),
    descricao: input.descricao?.trim() ?? "",
    duracao_minutos: Number(input.duracaoMinutos),
    valor_padrao: Number(input.valorPadrao),
    cor: input.cor.trim(),
    ativo: input.ativo ?? true,
  };
}

export const serviceService = {
  async list(filters: BusinessServiceListFilters = {}) {
    return executeServiceCall(
      async () => {
        const response = await apiClient.get<ServiceApiModel[]>("/services", {
          query: {
            search: filters.search?.trim() ?? "",
          },
        });

        return (response.data ?? []).map(fromApi);
      },
      {
        errorMessage: "Nao foi possivel carregar os servicos.",
      },
    );
  },
  async getById(serviceId: string) {
    return executeServiceCall(
      async () => {
        const response = await apiClient.get<ServiceApiModel>(`/services/${serviceId}`);
        return fromApi(response.data);
      },
      {
        errorMessage: "Nao foi possivel carregar o servico.",
      },
    );
  },
  async create(input: BusinessServiceInput) {
    return executeServiceCall(
      async () => {
        const response = await apiClient.post<ServiceApiModel>("/services", toApi(input));
        return fromApi(response.data);
      },
      {
        errorMessage: "Nao foi possivel criar o servico.",
      },
    );
  },
  async update(serviceId: string, input: BusinessServiceInput) {
    return executeServiceCall(
      async () => {
        const response = await apiClient.put<ServiceApiModel>(`/services/${serviceId}`, toApi(input));
        return fromApi(response.data);
      },
      {
        errorMessage: "Nao foi possivel atualizar o servico.",
      },
    );
  },
  async setActive(serviceId: string, ativo: boolean) {
    return executeServiceCall(
      async () => {
        const response = await apiClient.patch<ServiceApiModel>(`/services/${serviceId}/status`, {
          ativo,
        });
        return fromApi(response.data);
      },
      {
        errorMessage: ativo
          ? "Nao foi possivel ativar o servico."
          : "Nao foi possivel inativar o servico.",
      },
    );
  },
  async remove(serviceId: string) {
    return executeServiceCall(
      async () => {
        await apiClient.delete<void>(`/services/${serviceId}`);
      },
      {
        errorMessage: "Nao foi possivel excluir o servico.",
      },
    );
  },
};
