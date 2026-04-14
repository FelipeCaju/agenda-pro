import type { Appointment, AppointmentStatus } from "@/services/appointmentService";
import type { Reminder } from "@/services/reminderService";
import { apiClient } from "@/services/apiClient";
import { executeServiceCall } from "@/services/serviceHelpers";

function normalizeServiceColor(value: string | null | undefined) {
  const normalized = value?.trim();
  return normalized || "#1d8cf8";
}

export type DashboardPeriod = "today" | "7d" | "30d";
export type DashboardStatusFilter = "all" | AppointmentStatus;

export type DashboardSummary = {
  period: DashboardPeriod;
  status: DashboardStatusFilter;
  range: {
    start: string;
    end: string;
  };
  kpis: {
    totalAppointments: number;
    confirmedAppointments: number;
    pendingAppointments: number;
    canceledAppointments: number;
    scheduledRevenue: number;
    paidRevenue: number;
    pendingRevenue: number;
    averageTicket: number;
    activeClients: number;
    activeServices: number;
    reminderQueue: number;
  };
  charts: {
    timeline: Array<{
      date: string;
      total: number;
      confirmed: number;
      revenue: number;
    }>;
    statusBreakdown: Array<{
      status: DashboardStatusFilter;
      total: number;
    }>;
    servicesByVolume: Array<{
      serviceId: string;
      nome: string;
      cor: string;
      total: number;
    }>;
    servicesFinancial: Array<{
      serviceId: string;
      nome: string;
      cor: string;
      totalAppointments: number;
      paidRevenue: number;
      pendingRevenue: number;
    }>;
  };
  lists: {
    upcomingAppointments: Appointment[];
    reminders: Reminder[];
  };
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
  payment_status?: "pendente" | "pago";
  observacoes?: string | null;
  confirmacao_cliente: string;
  lembrete_enviado: boolean;
  lembrete_confirmado: boolean;
  lembrete_cancelado: boolean;
  data_envio_lembrete: string | null;
  resposta_whatsapp: string | null;
  quote_id?: string | null;
  service_order_id?: string | null;
  recurrence_series_id?: string | null;
  recurrence_type?: "none" | "weekly" | "biweekly" | "monthly";
  recurrence_index?: number;
  created_at?: string;
  updated_at?: string;
};

type ReminderApiModel = {
  id: string;
  appointmentId: string;
  title: string;
  channel: "whatsapp" | "sms" | "manual";
  scheduledAt: string;
  clienteNome: string;
  clienteTelefone: string | null;
  clienteEmail: string | null;
  servicoNome: string;
  reminderStatus: "pendente" | "enviado" | "confirmado" | "cancelado";
  lembreteEnviado: boolean;
  lembreteConfirmado: boolean;
  lembreteCancelado: boolean;
  confirmacaoCliente: "pendente" | "confirmado" | "cancelado" | "sem_resposta";
  respostaWhatsapp: string | null;
  dataEnvioLembrete: string | null;
  canSend: boolean;
};

type DashboardSummaryApiModel = {
  period: DashboardPeriod;
  status: DashboardStatusFilter;
  range: {
    start: string;
    end: string;
  };
  kpis: DashboardSummary["kpis"];
  charts: DashboardSummary["charts"];
  lists: {
    upcomingAppointments: AppointmentApiModel[];
    reminders: ReminderApiModel[];
  };
};

function toNumber(value: unknown) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function mapAppointment(model: AppointmentApiModel): Appointment {
  return {
    id: model.id,
    organizationId: model.organization_id,
    clienteId: model.cliente_id,
    clienteNome: model.cliente_nome,
    clienteEmail: model.cliente_email ?? null,
    servicoId: model.servico_id,
    servicoNome: model.servico_nome,
    servicoCor: normalizeServiceColor(model.servico_cor),
    profissionalId: model.profissional_id ?? null,
    profissionalNome: model.profissional_nome ?? null,
    data: model.data,
    horarioInicial: model.horario_inicial,
    horarioFinal: model.horario_final,
    valor: Number(model.valor ?? 0),
    ajusteValor: 0,
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
    recurrenceSeriesId: model.recurrence_series_id ?? null,
    recurrenceType: model.recurrence_type ?? "none",
    recurrenceIndex: Number(model.recurrence_index ?? 0),
    items: [
      {
        id: `${model.id}-dashboard-item`,
        appointmentId: model.id,
        servicoId: model.servico_id ?? null,
        servicoNome: model.servico_nome,
        servicoCor: normalizeServiceColor(model.servico_cor),
        ordem: 0,
        duracaoMinutos: 0,
        valorUnitario: Number(model.valor ?? 0),
        valorTotal: Number(model.valor ?? 0),
      },
    ],
    createdAt: model.created_at,
    updatedAt: model.updated_at,
  };
}

function mapReminder(model: ReminderApiModel): Reminder {
  return {
    id: model.id,
    appointmentId: model.appointmentId,
    title: model.title,
    channel: model.channel,
    scheduledAt: model.scheduledAt,
    clienteNome: model.clienteNome,
    clienteTelefone: model.clienteTelefone ?? null,
    clienteEmail: model.clienteEmail ?? null,
    servicoNome: model.servicoNome,
    reminderStatus: model.reminderStatus,
    lembreteEnviado: Boolean(model.lembreteEnviado),
    lembreteConfirmado: Boolean(model.lembreteConfirmado),
    lembreteCancelado: Boolean(model.lembreteCancelado),
    confirmacaoCliente: model.confirmacaoCliente,
    respostaWhatsapp: model.respostaWhatsapp ?? null,
    dataEnvioLembrete: model.dataEnvioLembrete ?? null,
    canSend: Boolean(model.canSend),
  };
}

function fromApi(model: DashboardSummaryApiModel): DashboardSummary {
  return {
    ...model,
    kpis: {
      totalAppointments: toNumber(model.kpis?.totalAppointments),
      confirmedAppointments: toNumber(model.kpis?.confirmedAppointments),
      pendingAppointments: toNumber(model.kpis?.pendingAppointments),
      canceledAppointments: toNumber(model.kpis?.canceledAppointments),
      scheduledRevenue: toNumber(model.kpis?.scheduledRevenue),
      paidRevenue: toNumber(model.kpis?.paidRevenue),
      pendingRevenue: toNumber(model.kpis?.pendingRevenue),
      averageTicket: toNumber(model.kpis?.averageTicket),
      activeClients: toNumber(model.kpis?.activeClients),
      activeServices: toNumber(model.kpis?.activeServices),
      reminderQueue: toNumber(model.kpis?.reminderQueue),
    },
    charts: {
      ...model.charts,
      timeline: (model.charts?.timeline ?? []).map((item) => ({
        ...item,
        total: toNumber(item.total),
        confirmed: toNumber(item.confirmed),
        revenue: toNumber(item.revenue),
      })),
      statusBreakdown: (model.charts?.statusBreakdown ?? []).map((item) => ({
        ...item,
        total: toNumber(item.total),
      })),
      servicesByVolume: (model.charts?.servicesByVolume ?? []).map((item) => ({
        ...item,
        total: toNumber(item.total),
      })),
      servicesFinancial: (model.charts?.servicesFinancial ?? []).map((item) => ({
        ...item,
        totalAppointments: toNumber(item.totalAppointments),
        paidRevenue: toNumber(item.paidRevenue),
        pendingRevenue: toNumber(item.pendingRevenue),
      })),
    },
    lists: {
      upcomingAppointments: (model.lists.upcomingAppointments ?? []).map(mapAppointment),
      reminders: (model.lists.reminders ?? []).map(mapReminder),
    },
  };
}

export const dashboardService = {
  async getSummary(filters: {
    period: DashboardPeriod;
    status: DashboardStatusFilter;
    startDate?: string;
    endDate?: string;
    clientId?: string;
    serviceId?: string;
  }) {
    return executeServiceCall(
      async () => {
        const response = await apiClient.get<DashboardSummaryApiModel>("/dashboard/summary", {
          query: {
            period: filters.period,
            status: filters.status,
            startDate: filters.startDate,
            endDate: filters.endDate,
            clientId: filters.clientId,
            serviceId: filters.serviceId,
          },
        });

        return fromApi(response.data);
      },
      {
        errorMessage: "Nao foi possivel carregar os indicadores do dashboard.",
      },
    );
  },
};
