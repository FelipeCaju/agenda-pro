import { apiClient } from "@/services/apiClient";
import { executeServiceCall } from "@/services/serviceHelpers";

export type RecurringProfile = {
  id: string;
  organizationId?: string;
  clientId: string;
  serviceId: string;
  descricao: string;
  valor: number;
  dataInicio: string;
  dataFim: string | null;
  diaCobranca1: number;
  diaCobranca2: number | null;
  diaCobranca3: number | null;
  diaCobranca4: number | null;
  chavePix: string;
  mensagemWhatsappPersonalizada: string;
  observacoes: string;
  ativo: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type RecurringProfileInput = {
  clientId: string;
  serviceId: string;
  descricao?: string;
  valor: number;
  dataInicio: string;
  dataFim?: string | null;
  diaCobranca1: number;
  diaCobranca2?: number | null;
  diaCobranca3?: number | null;
  diaCobranca4?: number | null;
  chavePix?: string;
  mensagemWhatsappPersonalizada?: string;
  observacoes?: string;
  ativo?: boolean;
};

export type RecurringProfileFilters = {
  search?: string;
  clientId?: string;
  serviceId?: string;
  ativo?: "all" | "true" | "false";
};

export type RecurringCharge = {
  id: string;
  organizationId?: string;
  recurringProfileId: string;
  clientId: string;
  clientName: string;
  serviceId: string;
  serviceName: string;
  descricao: string;
  valor: number;
  referenciaCompetencia: string;
  referenciaDataCobranca: string;
  dataVencimento: string;
  status: "pendente" | "pago" | "vencido" | "cancelado";
  dataPagamento: string | null;
  formaPagamento: string | null;
  observacoes: string;
  chavePixUtilizada: string;
  mensagemWhatsappUtilizada: string;
  whatsappEnviado: boolean;
  whatsappStatus: string | null;
  whatsappTentativas: number;
  whatsappUltimoEnvioEm: string | null;
  whatsappUltimoErro: string | null;
  criadoAutomaticamente: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type RecurringChargeFilters = {
  clientId?: string;
  serviceId?: string;
  profileId?: string;
  status?: "all" | "pendente" | "pago" | "vencido" | "cancelado";
  startDate?: string;
  endDate?: string;
};

export type RecurringSummary = {
  activeProfiles: number;
  pendingCharges: number;
  paidCharges: number;
  overdueCharges: number;
  totalPendingAmount: number;
  referenceMonth: string;
};

type RecurringProfileApiModel = {
  id: string;
  organization_id?: string;
  client_id: string;
  service_id: string;
  descricao?: string | null;
  valor: number;
  data_inicio: string;
  data_fim?: string | null;
  dia_cobranca_1: number;
  dia_cobranca_2?: number | null;
  dia_cobranca_3?: number | null;
  dia_cobranca_4?: number | null;
  chave_pix?: string | null;
  mensagem_whatsapp_personalizada?: string | null;
  observacoes?: string | null;
  ativo: boolean;
  created_at?: string;
  updated_at?: string;
};

type RecurringChargeApiModel = {
  id: string;
  organization_id?: string;
  recurring_profile_id: string;
  client_id: string;
  client_name: string;
  service_id: string;
  service_name: string;
  descricao?: string | null;
  valor: number;
  referencia_competencia: string;
  referencia_data_cobranca: string;
  data_vencimento: string;
  status: "pendente" | "pago" | "vencido" | "cancelado";
  data_pagamento?: string | null;
  forma_pagamento?: string | null;
  observacoes?: string | null;
  chave_pix_utilizada?: string | null;
  mensagem_whatsapp_utilizada?: string | null;
  whatsapp_enviado: boolean;
  whatsapp_status?: string | null;
  whatsapp_tentativas: number;
  whatsapp_ultimo_envio_em?: string | null;
  whatsapp_ultimo_erro?: string | null;
  criado_automaticamente: boolean;
  created_at?: string;
  updated_at?: string;
};

type RecurringSummaryApiModel = {
  activeProfiles: number;
  pendingCharges: number;
  paidCharges: number;
  overdueCharges: number;
  totalPendingAmount: number;
  referenceMonth: string;
};

function fromProfileApi(model: RecurringProfileApiModel): RecurringProfile {
  return {
    id: model.id,
    organizationId: model.organization_id,
    clientId: model.client_id,
    serviceId: model.service_id,
    descricao: model.descricao ?? "",
    valor: Number(model.valor ?? 0),
    dataInicio: model.data_inicio,
    dataFim: model.data_fim ?? null,
    diaCobranca1: Number(model.dia_cobranca_1),
    diaCobranca2: model.dia_cobranca_2 === null ? null : Number(model.dia_cobranca_2),
    diaCobranca3: model.dia_cobranca_3 === null ? null : Number(model.dia_cobranca_3),
    diaCobranca4: model.dia_cobranca_4 === null ? null : Number(model.dia_cobranca_4),
    chavePix: model.chave_pix ?? "",
    mensagemWhatsappPersonalizada: model.mensagem_whatsapp_personalizada ?? "",
    observacoes: model.observacoes ?? "",
    ativo: Boolean(model.ativo),
    createdAt: model.created_at,
    updatedAt: model.updated_at,
  };
}

function fromChargeApi(model: RecurringChargeApiModel): RecurringCharge {
  return {
    id: model.id,
    organizationId: model.organization_id,
    recurringProfileId: model.recurring_profile_id,
    clientId: model.client_id,
    clientName: model.client_name,
    serviceId: model.service_id,
    serviceName: model.service_name,
    descricao: model.descricao ?? "",
    valor: Number(model.valor ?? 0),
    referenciaCompetencia: model.referencia_competencia,
    referenciaDataCobranca: model.referencia_data_cobranca,
    dataVencimento: model.data_vencimento,
    status: model.status,
    dataPagamento: model.data_pagamento ?? null,
    formaPagamento: model.forma_pagamento ?? null,
    observacoes: model.observacoes ?? "",
    chavePixUtilizada: model.chave_pix_utilizada ?? "",
    mensagemWhatsappUtilizada: model.mensagem_whatsapp_utilizada ?? "",
    whatsappEnviado: Boolean(model.whatsapp_enviado),
    whatsappStatus: model.whatsapp_status ?? null,
    whatsappTentativas: Number(model.whatsapp_tentativas ?? 0),
    whatsappUltimoEnvioEm: model.whatsapp_ultimo_envio_em ?? null,
    whatsappUltimoErro: model.whatsapp_ultimo_erro ?? null,
    criadoAutomaticamente: Boolean(model.criado_automaticamente),
    createdAt: model.created_at,
    updatedAt: model.updated_at,
  };
}

function toProfileApi(input: RecurringProfileInput) {
  return {
    client_id: input.clientId,
    service_id: input.serviceId,
    descricao: input.descricao?.trim() ?? "",
    valor: Number(input.valor),
    data_inicio: input.dataInicio,
    data_fim: input.dataFim?.trim() || null,
    dia_cobranca_1: Number(input.diaCobranca1),
    dia_cobranca_2: input.diaCobranca2 ? Number(input.diaCobranca2) : null,
    dia_cobranca_3: input.diaCobranca3 ? Number(input.diaCobranca3) : null,
    dia_cobranca_4: input.diaCobranca4 ? Number(input.diaCobranca4) : null,
    chave_pix: input.chavePix?.trim() ?? "",
    mensagem_whatsapp_personalizada: input.mensagemWhatsappPersonalizada?.trim() ?? "",
    observacoes: input.observacoes?.trim() ?? "",
    ativo: input.ativo ?? true,
  };
}

export const recurrenceService = {
  async getSummary(referenceDate?: string) {
    return executeServiceCall(
      async () => {
        const response = await apiClient.get<RecurringSummaryApiModel>("/recurring/summary", {
          query: { referenceDate },
        });
        return response.data;
      },
      {
        errorMessage: "Nao foi possivel carregar o resumo de recorrencia.",
      },
    );
  },
  async listProfiles(filters: RecurringProfileFilters = {}) {
    return executeServiceCall(
      async () => {
        const response = await apiClient.get<RecurringProfileApiModel[]>("/recurring/profiles", {
          query: {
            search: filters.search?.trim() ?? "",
            clientId: filters.clientId ?? "",
            serviceId: filters.serviceId ?? "",
            ativo: filters.ativo ?? "all",
          },
        });
        return (response.data ?? []).map(fromProfileApi);
      },
      {
        errorMessage: "Nao foi possivel carregar as recorrencias.",
      },
    );
  },
  async getProfile(profileId: string) {
    return executeServiceCall(
      async () => {
        const response = await apiClient.get<RecurringProfileApiModel>(`/recurring/profiles/${profileId}`);
        return fromProfileApi(response.data);
      },
      {
        errorMessage: "Nao foi possivel carregar a recorrencia.",
      },
    );
  },
  async createProfile(input: RecurringProfileInput) {
    return executeServiceCall(
      async () => {
        const response = await apiClient.post<RecurringProfileApiModel>(
          "/recurring/profiles",
          toProfileApi(input),
        );
        return fromProfileApi(response.data);
      },
      {
        errorMessage: "Nao foi possivel criar a recorrencia.",
      },
    );
  },
  async updateProfile(profileId: string, input: RecurringProfileInput) {
    return executeServiceCall(
      async () => {
        const response = await apiClient.put<RecurringProfileApiModel>(
          `/recurring/profiles/${profileId}`,
          toProfileApi(input),
        );
        return fromProfileApi(response.data);
      },
      {
        errorMessage: "Nao foi possivel atualizar a recorrencia.",
      },
    );
  },
  async setProfileActive(profileId: string, ativo: boolean) {
    return executeServiceCall(
      async () => {
        const response = await apiClient.patch<RecurringProfileApiModel>(
          `/recurring/profiles/${profileId}/status`,
          { ativo },
        );
        return fromProfileApi(response.data);
      },
      {
        errorMessage: ativo
          ? "Nao foi possivel ativar a recorrencia."
          : "Nao foi possivel inativar a recorrencia.",
      },
    );
  },
  async removeProfile(profileId: string) {
    return executeServiceCall(
      async () => {
        await apiClient.delete<void>(`/recurring/profiles/${profileId}`);
      },
      {
        errorMessage: "Nao foi possivel excluir a recorrencia.",
      },
    );
  },
  async listCharges(filters: RecurringChargeFilters = {}) {
    return executeServiceCall(
      async () => {
        const response = await apiClient.get<RecurringChargeApiModel[]>("/recurring/charges", {
          query: {
            clientId: filters.clientId ?? "",
            serviceId: filters.serviceId ?? "",
            profileId: filters.profileId ?? "",
            status: filters.status ?? "all",
            startDate: filters.startDate ?? "",
            endDate: filters.endDate ?? "",
          },
        });
        return (response.data ?? []).map(fromChargeApi);
      },
      {
        errorMessage: "Nao foi possivel carregar as cobrancas recorrentes.",
      },
    );
  },
  async markChargeAsPaid(chargeId: string, input?: { formaPagamento?: string; observacoes?: string }) {
    return executeServiceCall(
      async () => {
        const response = await apiClient.patch<RecurringChargeApiModel>(
          `/recurring/charges/${chargeId}/pay`,
          {
            formaPagamento: input?.formaPagamento ?? "",
            observacoes: input?.observacoes ?? "",
          },
        );
        return fromChargeApi(response.data);
      },
      {
        errorMessage: "Nao foi possivel marcar a cobranca como paga.",
      },
    );
  },
  async cancelCharge(chargeId: string, input?: { observacoes?: string }) {
    return executeServiceCall(
      async () => {
        const response = await apiClient.patch<RecurringChargeApiModel>(
          `/recurring/charges/${chargeId}/cancel`,
          {
            observacoes: input?.observacoes ?? "",
          },
        );
        return fromChargeApi(response.data);
      },
      {
        errorMessage: "Nao foi possivel cancelar a cobranca.",
      },
    );
  },
  async resendChargeWhatsapp(chargeId: string) {
    return executeServiceCall(
      async () => {
        const response = await apiClient.post<RecurringChargeApiModel>(
          `/recurring/charges/${chargeId}/resend-whatsapp`,
        );
        return fromChargeApi(response.data);
      },
      {
        errorMessage: "Nao foi possivel reenviar o WhatsApp da cobranca.",
      },
    );
  },
  async runDaily(targetDate?: string) {
    return executeServiceCall(
      async () => {
        const response = await apiClient.post<{
          processedOrganizations: number;
          generatedCharges: number;
          sentWhatsapp: number;
          errors: Array<{ organizationId: string; profileId?: string; message: string }>;
        }>("/recurring/run-daily", {
          targetDate: targetDate ?? "",
          sendWhatsapp: true,
        });
        return response.data;
      },
      {
        errorMessage: "Nao foi possivel executar a rotina diaria de recorrencia.",
      },
    );
  },
};
