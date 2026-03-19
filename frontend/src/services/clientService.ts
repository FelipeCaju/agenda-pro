import { apiClient } from "@/services/apiClient";
import { executeServiceCall } from "@/services/serviceHelpers";

export type Client = {
  id: string;
  organization_id?: string;
  nome: string;
  telefone: string;
  email: string | null;
  observacoes: string;
  ativo: boolean;
  created_at?: string;
  updated_at?: string;
};

export type ClientInput = {
  nome: string;
  telefone?: string;
  email?: string;
  observacoes?: string;
  ativo?: boolean;
};

export type ClientListFilters = {
  search?: string;
};

function normalizeInput(input: ClientInput) {
  return {
    nome: input.nome.trim(),
    telefone: input.telefone?.trim() ?? "",
    email: input.email?.trim() ?? "",
    observacoes: input.observacoes?.trim() ?? "",
    ativo: input.ativo ?? true,
  };
}

export const clientService = {
  async list(filters: ClientListFilters = {}) {
    return executeServiceCall(
      async () => {
        const response = await apiClient.get<Client[]>("/clients", {
          query: {
            search: filters.search?.trim() ?? "",
          },
        });
        return response.data ?? [];
      },
      {
        errorMessage: "Nao foi possivel carregar os clientes.",
      },
    );
  },
  async getById(clientId: string) {
    return executeServiceCall(
      async () => {
        const response = await apiClient.get<Client>(`/clients/${clientId}`);
        return response.data;
      },
      {
        errorMessage: "Nao foi possivel carregar o cliente.",
      },
    );
  },
  async create(input: ClientInput) {
    return executeServiceCall(
      async () => {
        const response = await apiClient.post<Client>("/clients", normalizeInput(input));
        return response.data;
      },
      {
        errorMessage: "Nao foi possivel criar o cliente.",
      },
    );
  },
  async update(clientId: string, input: ClientInput) {
    return executeServiceCall(
      async () => {
        const response = await apiClient.put<Client>(
          `/clients/${clientId}`,
          normalizeInput(input),
        );
        return response.data;
      },
      {
        errorMessage: "Nao foi possivel atualizar o cliente.",
      },
    );
  },
  async setActive(clientId: string, ativo: boolean) {
    return executeServiceCall(
      async () => {
        const response = await apiClient.patch<Client>(`/clients/${clientId}/status`, {
          ativo,
        });
        return response.data;
      },
      {
        errorMessage: ativo
          ? "Nao foi possivel ativar o cliente."
          : "Nao foi possivel inativar o cliente.",
      },
    );
  },
  async remove(clientId: string) {
    return executeServiceCall(
      async () => {
        await apiClient.delete<void>(`/clients/${clientId}`);
      },
      {
        errorMessage: "Nao foi possivel excluir o cliente.",
      },
    );
  },
};
