import { apiClient } from "@/services/apiClient";
import { executeServiceCall } from "@/services/serviceHelpers";

export type AgendaView = "day" | "week" | "month";
export type AppointmentStatus = "pendente" | "confirmado" | "concluido" | "cancelado";
export type AppointmentPaymentStatus = "pendente" | "pago";

export type Appointment = {
  id: string;
  organizationId?: string;
  clienteId: string;
  clienteNome: string;
  clienteEmail: string | null;
  servicoId: string;
  servicoNome: string;
  servicoCor: string;
  profissionalId: string | null;
  profissionalNome: string | null;
  data: string;
  horarioInicial: string;
  horarioFinal: string;
  valor: number;
  status: AppointmentStatus;
  paymentStatus: AppointmentPaymentStatus;
  observacoes: string;
  confirmacaoCliente: string;
  lembreteEnviado: boolean;
  lembreteConfirmado: boolean;
  lembreteCancelado: boolean;
  dataEnvioLembrete: string | null;
  respostaWhatsapp: string | null;
  quoteId: string | null;
  serviceOrderId: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type AppointmentInput = {
  clienteId: string;
  servicoId: string;
  professionalId?: string | null;
  data: string;
  horarioInicial: string;
  horarioFinal: string;
  valor?: number;
  status?: AppointmentStatus;
  paymentStatus?: AppointmentPaymentStatus;
  observacoes?: string;
  confirmacaoCliente?: string;
  quoteId?: string | null;
  serviceOrderId?: string | null;
  recurrence?: {
    type: "none" | "weekly" | "monthly";
    count: number;
  };
};

export type AppointmentFilters = {
  date: string;
  view: AgendaView;
  professionalId?: string;
};

export type UpcomingAppointmentFilters = {
  daysAhead?: number;
  professionalId?: string;
};

export type AppointmentCreateResult = {
  appointment: Appointment;
  createdCount: number;
};

type AppointmentApiModel = {
  id: string;
  organization_id?: string;
  cliente_id: string;
  cliente_nome: string;
  cliente_email: string | null;
  servico_id: string;
  servico_nome: string;
  servico_cor: string;
  profissional_id: string | null;
  profissional_nome: string | null;
  data: string;
  horario_inicial: string;
  horario_final: string;
  valor: number;
  status: AppointmentStatus;
  payment_status: AppointmentPaymentStatus;
  observacoes?: string | null;
  confirmacao_cliente: string;
  lembrete_enviado: boolean;
  lembrete_confirmado: boolean;
  lembrete_cancelado: boolean;
  data_envio_lembrete: string | null;
  resposta_whatsapp: string | null;
  quote_id: string | null;
  service_order_id: string | null;
  created_at?: string;
  updated_at?: string;
};

function fromApi(model: AppointmentApiModel): Appointment {
  return {
    id: model.id,
    organizationId: model.organization_id,
    clienteId: model.cliente_id,
    clienteNome: model.cliente_nome,
    clienteEmail: model.cliente_email ?? null,
    servicoId: model.servico_id,
    servicoNome: model.servico_nome,
    servicoCor: model.servico_cor ?? "#1d8cf8",
    profissionalId: model.profissional_id ?? null,
    profissionalNome: model.profissional_nome ?? null,
    data: model.data,
    horarioInicial: model.horario_inicial,
    horarioFinal: model.horario_final,
    valor: Number(model.valor ?? 0),
    status: model.status,
    paymentStatus: model.payment_status ?? "pendente",
    observacoes: model.observacoes ?? "",
    confirmacaoCliente: model.confirmacao_cliente ?? "pendente",
    lembreteEnviado: Boolean(model.lembrete_enviado),
    lembreteConfirmado: Boolean(model.lembrete_confirmado),
    lembreteCancelado: Boolean(model.lembrete_cancelado),
    dataEnvioLembrete: model.data_envio_lembrete ?? null,
    respostaWhatsapp: model.resposta_whatsapp ?? null,
    quoteId: model.quote_id ?? null,
    serviceOrderId: model.service_order_id ?? null,
    createdAt: model.created_at,
    updatedAt: model.updated_at,
  };
}

function toApi(input: AppointmentInput) {
  return {
    cliente_id: input.clienteId,
    servico_id: input.servicoId,
    profissional_id: input.professionalId ?? null,
    data: input.data,
    horario_inicial: input.horarioInicial,
    horario_final: input.horarioFinal,
    valor: input.valor,
    status: input.status ?? "confirmado",
    payment_status: input.paymentStatus ?? "pendente",
    observacoes: input.observacoes ?? "",
    confirmacao_cliente: input.confirmacaoCliente ?? "pendente",
    quote_id: input.quoteId ?? null,
    service_order_id: input.serviceOrderId ?? null,
    recurrence:
      input.recurrence && input.recurrence.type !== "none"
        ? input.recurrence
        : undefined,
  };
}

export const appointmentService = {
  async list(filters: AppointmentFilters) {
    return executeServiceCall(
      async () => {
        const response = await apiClient.get<AppointmentApiModel[]>("/agenda", {
          query: {
            date: filters.date,
            view: filters.view,
            professionalId: filters.professionalId,
          },
        });

        return (response.data ?? []).map(fromApi);
      },
      {
        errorMessage: "Nao foi possivel carregar os agendamentos.",
      },
    );
  },
  async getById(appointmentId: string) {
    return executeServiceCall(
      async () => {
        const response = await apiClient.get<AppointmentApiModel>(`/agenda/${appointmentId}`);
        return fromApi(response.data);
      },
      {
        errorMessage: "Nao foi possivel carregar o agendamento.",
      },
    );
  },
  async listUpcoming(filters: UpcomingAppointmentFilters = {}) {
    return executeServiceCall(
      async () => {
        const response = await apiClient.get<AppointmentApiModel[]>("/agenda/upcoming", {
          query: {
            daysAhead: filters.daysAhead ?? 45,
            professionalId: filters.professionalId,
          },
        });

        return (response.data ?? []).map(fromApi);
      },
      {
        errorMessage: "Nao foi possivel carregar os proximos agendamentos.",
      },
    );
  },
  async create(input: AppointmentInput) {
    return executeServiceCall(
      async () => {
        const response = await apiClient.post<AppointmentApiModel>("/agenda", toApi(input));
        return {
          appointment: fromApi(response.data),
          createdCount: Number(response.meta?.createdCount ?? 1),
        } satisfies AppointmentCreateResult;
      },
      {
        errorMessage: "Nao foi possivel criar o agendamento.",
      },
    );
  },
  async update(appointmentId: string, input: AppointmentInput) {
    return executeServiceCall(
      async () => {
        const response = await apiClient.put<AppointmentApiModel>(
          `/agenda/${appointmentId}`,
          toApi(input),
        );
        return fromApi(response.data);
      },
      {
        errorMessage: "Nao foi possivel atualizar o agendamento.",
      },
    );
  },
  async updateStatus(appointmentId: string, status: AppointmentStatus) {
    return executeServiceCall(
      async () => {
        const response = await apiClient.patch<AppointmentApiModel>(
          `/agenda/${appointmentId}/status`,
          { status },
        );
        return fromApi(response.data);
      },
      {
        errorMessage: "Nao foi possivel atualizar o status do agendamento.",
      },
    );
  },
  async updatePaymentStatus(appointmentId: string, paymentStatus: AppointmentPaymentStatus) {
    return executeServiceCall(
      async () => {
        const response = await apiClient.patch<AppointmentApiModel>(
          `/agenda/${appointmentId}/payment-status`,
          { paymentStatus },
        );
        return fromApi(response.data);
      },
      {
        errorMessage: "Nao foi possivel atualizar o status de pagamento.",
      },
    );
  },
  async remove(appointmentId: string) {
    return executeServiceCall(
      async () => {
        await apiClient.delete<void>(`/agenda/${appointmentId}`);
      },
      {
        errorMessage: "Nao foi possivel remover o agendamento.",
      },
    );
  },
};
