import { apiClient } from "@/services/apiClient";
import { executeServiceCall } from "@/services/serviceHelpers";

export type OrcamentoStatus = "pendente" | "aprovado" | "recusado";

export type OrcamentoItem = {
  id: string;
  serviceId: string | null;
  serviceName: string;
  freeDescription: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  notes: string;
};

export type Orcamento = {
  id: string;
  clientId: string;
  clientName: string;
  status: OrcamentoStatus;
  subtotal: number;
  discount: number;
  total: number;
  notes: string;
  appointmentId: string | null;
  serviceOrderId: string | null;
  approvedAt: string | null;
  rejectedAt: string | null;
  createdAt: string;
  updatedAt: string;
  items: OrcamentoItem[];
};

export type OrcamentoInputItem = {
  id?: string;
  serviceId?: string | null;
  description?: string;
  quantity: number;
  unitPrice: number;
  notes?: string;
};

export type OrcamentoInput = {
  clientId: string;
  discount?: number;
  notes?: string;
  items: OrcamentoInputItem[];
};

export type OrcamentoAppointmentDraft = {
  quoteId: string;
  clientId: string;
  serviceId: string;
  items: Array<{
    id: string;
    serviceId: string;
    unitPrice: number;
    totalPrice: number;
  }>;
  notes: string;
};

type OrcamentoItemApiModel = {
  id: string;
  servico_id: string | null;
  servico_nome: string;
  descricao_livre: string | null;
  quantidade: number;
  valor_unitario: number;
  valor_total: number;
  observacoes: string | null;
};

type OrcamentoApiModel = {
  id: string;
  cliente_id: string;
  cliente_nome: string;
  status: OrcamentoStatus;
  subtotal: number;
  desconto: number;
  valor_total: number;
  observacoes: string | null;
  appointment_id: string | null;
  service_order_id: string | null;
  approved_at: string | null;
  rejected_at: string | null;
  created_at: string;
  updated_at: string;
  itens: OrcamentoItemApiModel[];
};

type OrcamentoAppointmentDraftApiModel = {
  quote_id: string;
  cliente_id: string;
  servico_id: string;
  items?: Array<{
    id: string;
    servico_id: string;
    valor_unitario: number;
    valor_total: number;
  }>;
  observacoes: string;
};

function fromApiItem(item: OrcamentoItemApiModel): OrcamentoItem {
  return {
    id: item.id,
    serviceId: item.servico_id ?? null,
    serviceName: item.servico_nome,
    freeDescription: item.descricao_livre ?? "",
    quantity: Number(item.quantidade ?? 0),
    unitPrice: Number(item.valor_unitario ?? 0),
    totalPrice: Number(item.valor_total ?? 0),
    notes: item.observacoes ?? "",
  };
}

function fromApi(model: OrcamentoApiModel): Orcamento {
  return {
    id: model.id,
    clientId: model.cliente_id,
    clientName: model.cliente_nome,
    status: model.status,
    subtotal: Number(model.subtotal ?? 0),
    discount: Number(model.desconto ?? 0),
    total: Number(model.valor_total ?? 0),
    notes: model.observacoes ?? "",
    appointmentId: model.appointment_id ?? null,
    serviceOrderId: model.service_order_id ?? null,
    approvedAt: model.approved_at ?? null,
    rejectedAt: model.rejected_at ?? null,
    createdAt: model.created_at,
    updatedAt: model.updated_at,
    items: (model.itens ?? []).map(fromApiItem),
  };
}

function toApi(input: OrcamentoInput) {
  return {
    cliente_id: input.clientId,
    desconto: input.discount ?? 0,
    observacoes: input.notes ?? "",
    itens: input.items.map((item) => ({
      id: item.id,
      servico_id: item.serviceId ?? null,
      descricao_livre: item.description ?? "",
      quantidade: Number(item.quantity),
      valor_unitario: Number(item.unitPrice),
      observacoes: item.notes ?? "",
    })),
  };
}

export const orcamentoService = {
  async list() {
    return executeServiceCall(
      async () => {
        const response = await apiClient.get<OrcamentoApiModel[]>("/quotes");
        return (response.data ?? []).map(fromApi);
      },
      {
        errorMessage: "Nao foi possivel carregar os orcamentos.",
      },
    );
  },
  async getById(quoteId: string) {
    return executeServiceCall(
      async () => {
        const response = await apiClient.get<OrcamentoApiModel>(`/quotes/${quoteId}`);
        return fromApi(response.data);
      },
      {
        errorMessage: "Nao foi possivel carregar o orcamento.",
      },
    );
  },
  async create(input: OrcamentoInput) {
    return executeServiceCall(
      async () => {
        const response = await apiClient.post<OrcamentoApiModel>("/quotes", toApi(input));
        return fromApi(response.data);
      },
      {
        errorMessage: "Nao foi possivel criar o orcamento.",
      },
    );
  },
  async update(quoteId: string, input: OrcamentoInput) {
    return executeServiceCall(
      async () => {
        const response = await apiClient.put<OrcamentoApiModel>(`/quotes/${quoteId}`, toApi(input));
        return fromApi(response.data);
      },
      {
        errorMessage: "Nao foi possivel atualizar o orcamento.",
      },
    );
  },
  async approve(quoteId: string) {
    return executeServiceCall(
      async () => {
        const response = await apiClient.post<OrcamentoApiModel>(`/quotes/${quoteId}/approve`);
        return fromApi(response.data);
      },
      {
        errorMessage: "Nao foi possivel aprovar o orcamento.",
      },
    );
  },
  async reject(quoteId: string) {
    return executeServiceCall(
      async () => {
        const response = await apiClient.post<OrcamentoApiModel>(`/quotes/${quoteId}/reject`);
        return fromApi(response.data);
      },
      {
        errorMessage: "Nao foi possivel recusar o orcamento.",
      },
    );
  },
  async createAppointmentDraft(quoteId: string) {
    return executeServiceCall(
      async () => {
        const response = await apiClient.post<OrcamentoAppointmentDraftApiModel>(
          `/quotes/${quoteId}/schedule-draft`,
        );
        return {
          quoteId: response.data.quote_id,
          clientId: response.data.cliente_id,
          serviceId: response.data.servico_id,
          items: (response.data.items ?? []).map((item) => ({
            id: item.id,
            serviceId: item.servico_id,
            unitPrice: Number(item.valor_unitario ?? 0),
            totalPrice: Number(item.valor_total ?? 0),
          })),
          notes: response.data.observacoes ?? "",
        } satisfies OrcamentoAppointmentDraft;
      },
      {
        errorMessage: "Nao foi possivel transformar o orcamento em rascunho de agendamento.",
      },
    );
  },
  async convertToServiceOrder(quoteId: string) {
    return executeServiceCall(
      async () => {
        const response = await apiClient.post<OrcamentoApiModel>(`/quotes/${quoteId}/service-order`);
        return response.data;
      },
      {
        errorMessage: "Nao foi possivel converter o orcamento em ordem de servico.",
      },
    );
  },
};
