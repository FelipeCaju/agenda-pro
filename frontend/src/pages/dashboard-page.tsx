import { useDeferredValue, useMemo, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { MobilePageHeader } from "@/components/layout/mobile-page-header";
import { Card } from "@/components/ui/card";
import {
  CalendarIcon,
  ClockIcon,
  MoneyIcon,
  ScissorsIcon,
  TrendIcon,
  UsersIcon,
} from "@/components/ui/icons";
import { useClientsQuery } from "@/hooks/use-clients-query";
import { useDashboardSummary } from "@/hooks/use-dashboard-summary";
import { useServicesQuery } from "@/hooks/use-services-query";
import { useSettingsQuery } from "@/hooks/use-settings-query";
import { orcamentoKeys } from "@/hooks/use-orcamentos-query";
import { recurrenceKeys } from "@/hooks/use-recurrence-query";
import { type DashboardStatusFilter } from "@/services/dashboardService";
import { orcamentoService, type Orcamento, type OrcamentoStatus } from "@/services/orcamentoService";
import {
  recurrenceService,
  type RecurringCharge,
  type RecurringChargeFilters,
} from "@/services/recurrenceService";
import { formatDateBr, formatDateTimeBr, getCurrentMonthRange } from "@/utils/date";

type DashboardView = "agenda" | "recorrencia" | "orcamentos";
type RecurrenceDashboardStatus = "all" | "pendente" | "pago" | "vencido" | "cancelado";

function safeNumber(value: unknown) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeDay(value?: string | null) {
  if (!value) {
    return "";
  }

  return value.slice(0, 10);
}

function isDateInRange(date: string, startDate: string, endDate: string) {
  if (!date) {
    return false;
  }

  return date >= startDate && date <= endDate;
}

function getQuoteStatusLabel(status: OrcamentoStatus) {
  if (status === "aprovado") return "Fechado";
  if (status === "recusado") return "Nao fechado";
  return "Em aberto";
}

function getQuoteStatusTone(status: OrcamentoStatus) {
  if (status === "aprovado") return "bg-emerald-50 text-emerald-700";
  if (status === "recusado") return "bg-rose-50 text-rose-700";
  return "bg-amber-50 text-amber-700";
}

function getRecurringStatusLabel(status: RecurringCharge["status"]) {
  if (status === "pago") return "Pago";
  if (status === "vencido") return "Nao pago";
  if (status === "cancelado") return "Cancelado";
  return "Pendente";
}

function getRecurringStatusTone(status: RecurringCharge["status"]) {
  if (status === "pago") return "bg-emerald-50 text-emerald-700";
  if (status === "vencido") return "bg-rose-50 text-rose-700";
  if (status === "cancelado") return "bg-slate-100 text-slate-600";
  return "bg-amber-50 text-amber-700";
}

function isQuoteOpen(status: OrcamentoStatus) {
  return status === "pendente";
}

function isRecurringUnpaid(status: RecurringCharge["status"]) {
  return status === "pendente" || status === "vencido";
}

function MetricCard({
  icon,
  iconTone,
  label,
  value,
}: {
  icon: ReactNode;
  iconTone: string;
  label: string;
  value: string;
}) {
  return (
    <Card className="rounded-[22px] border border-slate-200/70 bg-white px-4 py-4 shadow-[0_4px_16px_rgba(15,23,36,0.05)] xl:min-h-[180px] xl:px-5 xl:py-5">
      <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${iconTone}`}>{icon}</div>
      <p className="mt-6 text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-[1.85rem] font-semibold tracking-[-0.04em] text-ink">{value}</p>
    </Card>
  );
}

function HighlightCard({
  icon,
  iconTone,
  title,
  name,
  subtitle,
}: {
  icon: ReactNode;
  iconTone: string;
  title: string;
  name: string;
  subtitle: string;
}) {
  return (
    <Card className="rounded-[22px] border border-slate-200/70 bg-white px-4 py-4 shadow-[0_4px_16px_rgba(15,23,36,0.05)] xl:min-h-[132px] xl:px-5 xl:py-5">
      <div className="flex items-center gap-4">
        <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${iconTone}`}>{icon}</div>
        <div>
          <p className="text-sm text-slate-500">{title}</p>
          <p className="text-[1.08rem] font-semibold tracking-[-0.02em] text-ink">{name}</p>
          <p className="text-sm text-slate-400">{subtitle}</p>
        </div>
      </div>
    </Card>
  );
}

function EmptyState({ message, detail }: { message: string; detail: string }) {
  return (
    <Card className="rounded-[22px] border border-slate-200/70 bg-white px-5 py-6 shadow-[0_4px_16px_rgba(15,23,36,0.05)]">
      <p className="text-sm font-semibold text-ink">{message}</p>
      <p className="mt-1 text-sm text-slate-500">{detail}</p>
    </Card>
  );
}

function SegmentedButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
        active
          ? "bg-brand-500 text-white shadow-[0_10px_22px_rgba(29,140,248,0.22)]"
          : "bg-white text-slate-500"
      }`}
      onClick={onClick}
      type="button"
    >
      {label}
    </button>
  );
}

function ServiceFinanceChart({
  items,
  currencyFormatter,
}: {
  items: Array<{
    serviceId: string;
    nome: string;
    cor: string;
    totalAppointments: number;
    paidRevenue: number;
    pendingRevenue: number;
  }>;
  currencyFormatter: Intl.NumberFormat;
}) {
  const maxTotal = Math.max(...items.map((item) => item.paidRevenue + item.pendingRevenue), 1);

  if (!items.length) {
    return null;
  }

  return (
    <Card className="rounded-[22px] border border-slate-200/70 bg-white px-4 py-4 shadow-[0_4px_16px_rgba(15,23,36,0.05)] xl:px-5 xl:py-5">
      <p className="text-sm font-semibold text-ink">Financeiro por servico</p>
      <div className="mt-5 space-y-4">
        {items.map((item) => {
          const total = item.paidRevenue + item.pendingRevenue;
          const paidWidth = total > 0 ? (item.paidRevenue / maxTotal) * 100 : 0;
          const pendingWidth = total > 0 ? (item.pendingRevenue / maxTotal) * 100 : 0;

          return (
            <div className="rounded-[18px] border border-slate-100 bg-slate-50/70 px-3 py-3" key={item.serviceId}>
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-3 w-3 shrink-0 rounded-full"
                      style={{ backgroundColor: item.cor || "#1d8cf8" }}
                    />
                    <p className="truncate text-sm font-semibold text-ink">{item.nome}</p>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">{item.totalAppointments} atendimento(s)</p>
                </div>
                <p className="text-right text-xs font-medium text-slate-500">{currencyFormatter.format(total)}</p>
              </div>

              <div className="mt-3 flex h-3 overflow-hidden rounded-full bg-slate-200">
                <div className="rounded-l-full bg-emerald-500" style={{ width: `${paidWidth}%` }} />
                <div className="rounded-r-full bg-amber-400" style={{ width: `${pendingWidth}%` }} />
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                <span>Recebido: {currencyFormatter.format(item.paidRevenue)}</span>
                <span>A receber: {currencyFormatter.format(item.pendingRevenue)}</span>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function MobileDataCard({
  title,
  rows,
  badge,
}: {
  title: string;
  rows: Array<{ label: string; value: string }>;
  badge?: ReactNode;
}) {
  return (
    <Card className="space-y-3 rounded-[22px] border border-slate-200/70 bg-white px-4 py-4 shadow-[0_4px_16px_rgba(15,23,36,0.05)]">
      <div className="flex items-start justify-between gap-3">
        <p className="text-base font-semibold text-ink">{title}</p>
        {badge}
      </div>
      <div className="space-y-2">
        {rows.map((row) => (
          <div className="flex items-center justify-between gap-3 text-sm" key={row.label}>
            <span className="text-slate-500">{row.label}</span>
            <span className="text-right font-medium text-ink">{row.value}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

export function DashboardPage() {
  const monthRange = useMemo(() => getCurrentMonthRange(), []);
  const [activeView, setActiveView] = useState<DashboardView>("agenda");
  const [startDate, setStartDate] = useState(monthRange.start);
  const [endDate, setEndDate] = useState(monthRange.end);
  const [clientId, setClientId] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [agendaStatus, setAgendaStatus] = useState<DashboardStatusFilter>("all");
  const [quoteStatus, setQuoteStatus] = useState<"all" | OrcamentoStatus>("all");
  const [recurrenceStatus, setRecurrenceStatus] = useState<RecurrenceDashboardStatus>("all");
  const { data: settings } = useSettingsQuery();
  const { data: clients = [] } = useClientsQuery();
  const { data: services = [] } = useServicesQuery();

  const deferredFilters = useDeferredValue({
    startDate,
    endDate,
    clientId,
    serviceId,
    agendaStatus,
    quoteStatus,
    recurrenceStatus,
  });

  const { data: agendaData, error: agendaError, isError: isAgendaError, isLoading: isAgendaLoading } =
    useDashboardSummary({
      period: "30d",
      status: deferredFilters.agendaStatus,
      startDate: deferredFilters.startDate,
      endDate: deferredFilters.endDate,
      clientId: deferredFilters.clientId || undefined,
      serviceId: deferredFilters.serviceId || undefined,
    });

  const {
    data: quotes = [],
    error: quotesError,
    isError: isQuotesError,
    isLoading: isQuotesLoading,
  } = useQuery({
    queryKey: [orcamentoKeys.list(), deferredFilters],
    queryFn: () => orcamentoService.list(),
    staleTime: 30_000,
    enabled: activeView === "orcamentos",
    placeholderData: (previousData) => previousData,
  });

  const recurringChargeFilters = useMemo<RecurringChargeFilters>(
    () => ({
      clientId: deferredFilters.clientId || "",
      serviceId: deferredFilters.serviceId || "",
      status: deferredFilters.recurrenceStatus,
      startDate: deferredFilters.startDate,
      endDate: deferredFilters.endDate,
    }),
    [deferredFilters],
  );

  const {
    data: recurringCharges = [],
    error: recurringError,
    isError: isRecurringError,
    isLoading: isRecurringLoading,
  } = useQuery({
    queryKey: [recurrenceKeys.chargeList(recurringChargeFilters)],
    queryFn: () => recurrenceService.listCharges(recurringChargeFilters),
    staleTime: 30_000,
    enabled: activeView === "recorrencia",
    placeholderData: (previousData) => previousData,
  });

  const currencyFormatter = useMemo(
    () =>
      new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: settings?.moeda ?? "BRL",
      }),
    [settings?.moeda],
  );

  const filteredQuotes = useMemo(() => {
    return quotes.filter((quote) => {
      const quoteDate = normalizeDay(quote.createdAt);

      if (!quoteDate || !isDateInRange(quoteDate, deferredFilters.startDate, deferredFilters.endDate)) {
        return false;
      }

      if (deferredFilters.clientId && quote.clientId !== deferredFilters.clientId) {
        return false;
      }

      if (
        deferredFilters.serviceId &&
        !quote.items.some((item) => item.serviceId === deferredFilters.serviceId)
      ) {
        return false;
      }

      if (deferredFilters.quoteStatus !== "all" && quote.status !== deferredFilters.quoteStatus) {
        return false;
      }

      return true;
    });
  }, [deferredFilters, quotes]);

  const agendaTopService = useMemo(() => {
    return agendaData?.charts.servicesByVolume[0] ?? null;
  }, [agendaData?.charts.servicesByVolume]);

  const agendaTopClient = useMemo(() => {
    const appointments = agendaData?.lists.upcomingAppointments ?? [];
    if (!appointments.length) {
      return null;
    }

    const grouped = appointments.reduce<Record<string, { nome: string; total: number }>>((acc, appointment) => {
      const current = acc[appointment.clienteId] ?? {
        nome: appointment.clienteNome,
        total: 0,
      };
      current.total += 1;
      acc[appointment.clienteId] = current;
      return acc;
    }, {});

    return Object.values(grouped).sort((left, right) => right.total - left.total)[0] ?? null;
  }, [agendaData?.lists.upcomingAppointments]);

  const quotesSummary = useMemo(() => {
    const approved = filteredQuotes.filter((quote) => quote.status === "aprovado");
    const open = filteredQuotes.filter((quote) => isQuoteOpen(quote.status));
    const notClosed = filteredQuotes.filter((quote) => quote.status !== "aprovado");

    return {
      total: filteredQuotes.length,
      approvedTotal: approved.length,
      openTotal: open.length,
      notClosedTotal: notClosed.length,
      approvedAmount: approved.reduce((sum, quote) => sum + safeNumber(quote.total), 0),
      openAmount: open.reduce((sum, quote) => sum + safeNumber(quote.total), 0),
      closeRate: filteredQuotes.length ? (approved.length / filteredQuotes.length) * 100 : 0,
      topClient:
        Object.values(
          filteredQuotes.reduce<Record<string, { nome: string; total: number }>>((acc, quote) => {
            const current = acc[quote.clientId] ?? { nome: quote.clientName, total: 0 };
            current.total += 1;
            acc[quote.clientId] = current;
            return acc;
          }, {}),
        ).sort((left, right) => right.total - left.total)[0] ?? null,
    };
  }, [filteredQuotes]);

  const recurringSummary = useMemo(() => {
    const paid = recurringCharges.filter((charge) => charge.status === "pago");
    const unpaid = recurringCharges.filter((charge) => isRecurringUnpaid(charge.status));

    const clientsStatus = Object.values(
      recurringCharges.reduce<Record<string, { nome: string; pago: number; naoPago: number; total: number }>>(
        (acc, charge) => {
          const current = acc[charge.clientId] ?? {
            nome: charge.clientName,
            pago: 0,
            naoPago: 0,
            total: 0,
          };

          current.total += 1;
          if (charge.status === "pago") {
            current.pago += 1;
          } else if (isRecurringUnpaid(charge.status)) {
            current.naoPago += 1;
          }

          acc[charge.clientId] = current;
          return acc;
        },
        {},
      ),
    ).sort((left, right) => right.total - left.total);

    return {
      total: recurringCharges.length,
      paidCount: paid.length,
      unpaidCount: unpaid.length,
      paidAmount: paid.reduce((sum, charge) => sum + safeNumber(charge.valor), 0),
      unpaidAmount: unpaid.reduce((sum, charge) => sum + safeNumber(charge.valor), 0),
      topClient: clientsStatus[0] ?? null,
      clientsStatus,
    };
  }, [recurringCharges]);

  const statusOptions = useMemo(() => {
    if (activeView === "orcamentos") {
      return [
        { value: "all", label: "Todos os status" },
        { value: "pendente", label: "Em aberto" },
        { value: "aprovado", label: "Fechado" },
        { value: "recusado", label: "Nao fechado" },
      ] as const;
    }

    if (activeView === "recorrencia") {
      return [
        { value: "all", label: "Todos os status" },
        { value: "pendente", label: "Pendentes" },
        { value: "pago", label: "Pagos" },
        { value: "vencido", label: "Vencidos" },
        { value: "cancelado", label: "Cancelados" },
      ] as const;
    }

    return [
      { value: "all", label: "Todos os status" },
      { value: "pendente", label: "Pendentes" },
      { value: "confirmado", label: "Confirmados" },
      { value: "concluido", label: "Concluidos" },
      { value: "cancelado", label: "Cancelados" },
    ] as const;
  }, [activeView]);

  const selectedStatusValue =
    activeView === "agenda" ? agendaStatus : activeView === "orcamentos" ? quoteStatus : recurrenceStatus;

  function handleStatusChange(value: string) {
    if (activeView === "agenda") {
      setAgendaStatus(value as DashboardStatusFilter);
      return;
    }

    if (activeView === "orcamentos") {
      setQuoteStatus(value as "all" | OrcamentoStatus);
      return;
    }

    setRecurrenceStatus(value as RecurrenceDashboardStatus);
  }

  return (
    <section className="space-y-4 pb-24 xl:space-y-5">
      <MobilePageHeader subtitle="Agenda, recorrencia e orcamentos" title="Painel" />

      <Card className="rounded-[22px] border border-slate-200/70 bg-white px-4 py-4 shadow-[0_4px_16px_rgba(15,23,36,0.05)] xl:px-5 xl:py-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="text-sm font-semibold text-ink">Visao do painel</p>
            <p className="text-sm text-slate-500">Separei por modulo para a tela continuar leve no celular e no desktop.</p>
          </div>

          <div className="inline-flex flex-wrap gap-2 rounded-full bg-slate-100 p-1">
            <SegmentedButton active={activeView === "agenda"} label="Agenda" onClick={() => setActiveView("agenda")} />
            <SegmentedButton
              active={activeView === "recorrencia"}
              label="Recorrencia"
              onClick={() => setActiveView("recorrencia")}
            />
            <SegmentedButton
              active={activeView === "orcamentos"}
              label="Orcamentos"
              onClick={() => setActiveView("orcamentos")}
            />
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5 xl:gap-4">
          <label className="block space-y-2">
            <span className="text-sm text-slate-500">Data Inicial</span>
            <div className="relative">
              <input
                className="app-input pr-11"
                onChange={(event) => setStartDate(event.target.value)}
                type="date"
                value={startDate}
              />
              <CalendarIcon className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            </div>
          </label>

          <label className="block space-y-2">
            <span className="text-sm text-slate-500">Data Final</span>
            <div className="relative">
              <input
                className="app-input pr-11"
                onChange={(event) => setEndDate(event.target.value)}
                type="date"
                value={endDate}
              />
              <CalendarIcon className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            </div>
          </label>

          <label className="block space-y-2">
            <span className="text-sm text-slate-500">Servico</span>
            <select className="app-input" onChange={(event) => setServiceId(event.target.value)} value={serviceId}>
              <option value="">Todos os servicos</option>
              {services.map((service) => (
                <option key={service.id} value={service.id}>
                  {service.nome}
                </option>
              ))}
            </select>
          </label>

          <label className="block space-y-2">
            <span className="text-sm text-slate-500">Cliente</span>
            <select className="app-input" onChange={(event) => setClientId(event.target.value)} value={clientId}>
              <option value="">Todos os clientes</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.nome}
                </option>
              ))}
            </select>
          </label>

          <label className="block space-y-2">
            <span className="text-sm text-slate-500">Status</span>
            <select className="app-input" onChange={(event) => handleStatusChange(event.target.value)} value={selectedStatusValue}>
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-[18px] bg-slate-50 px-4 py-3 text-sm text-slate-500">
          <span>
            Periodo selecionado: {formatDateBr(startDate)} ate {formatDateBr(endDate)}
          </span>
          <button
            className="font-semibold text-brand-600"
            onClick={() => {
              setStartDate(monthRange.start);
              setEndDate(monthRange.end);
            }}
            type="button"
          >
            Voltar para mes atual
          </button>
        </div>
      </Card>

      {activeView === "agenda" ? (
        <>
          {isAgendaLoading ? (
            <Card className="bg-white">
              <p className="text-sm text-slate-500">Carregando painel da agenda...</p>
            </Card>
          ) : null}

          {isAgendaError ? (
            <Card className="app-message-error">
              <p className="text-sm font-medium">{agendaError.message}</p>
            </Card>
          ) : null}

          {agendaData ? (
            <>
              <div className="grid grid-cols-2 gap-3 xl:grid-cols-4 xl:gap-4">
                <MetricCard
                  icon={<MoneyIcon className="h-5 w-5 text-emerald-600" />}
                  iconTone="bg-emerald-50"
                  label="Valor Recebido"
                  value={currencyFormatter.format(safeNumber(agendaData.kpis.paidRevenue))}
                />
                <MetricCard
                  icon={<ClockIcon className="h-5 w-5 text-brand-600" />}
                  iconTone="bg-brand-50"
                  label="Valor a Receber"
                  value={currencyFormatter.format(safeNumber(agendaData.kpis.pendingRevenue))}
                />
                <MetricCard
                  icon={<CalendarIcon className="h-5 w-5 text-slate-500" />}
                  iconTone="bg-slate-100"
                  label="Total de Atendimentos"
                  value={String(safeNumber(agendaData.kpis.totalAppointments))}
                />
                <MetricCard
                  icon={<TrendIcon className="h-5 w-5 text-violet-600" />}
                  iconTone="bg-violet-50"
                  label="Ticket Medio"
                  value={currencyFormatter.format(safeNumber(agendaData.kpis.averageTicket))}
                />
              </div>

              <div className="grid gap-3 xl:grid-cols-2 xl:gap-4">
                <HighlightCard
                  icon={<ScissorsIcon className="h-5 w-5 text-amber-500" />}
                  iconTone="bg-amber-50"
                  name={agendaTopService?.nome ?? "Sem destaque"}
                  subtitle={`${agendaTopService?.total ?? 0} atendimento(s)`}
                  title="Servico mais realizado"
                />

                <HighlightCard
                  icon={<UsersIcon className="h-5 w-5 text-brand-500" />}
                  iconTone="bg-brand-50"
                  name={agendaTopClient?.nome ?? "Sem destaque"}
                  subtitle={`${agendaTopClient?.total ?? 0} atendimento(s) no recorte atual`}
                  title="Cliente em destaque"
                />
              </div>

              <ServiceFinanceChart
                currencyFormatter={currencyFormatter}
                items={agendaData.charts.servicesFinancial}
              />

              {(agendaData.lists.upcomingAppointments ?? []).length ? (
                <>
                  <div className="space-y-3 md:hidden">
                    {agendaData.lists.upcomingAppointments.map((appointment) => (
                      <MobileDataCard
                        badge={
                          <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
                            {appointment.status}
                          </span>
                        }
                        key={appointment.id}
                        rows={[
                          { label: "Cliente", value: appointment.clienteNome },
                          { label: "Servico", value: appointment.servicoNome },
                          { label: "Horario", value: `${appointment.horarioInicial} - ${appointment.horarioFinal}` },
                          { label: "Valor", value: currencyFormatter.format(safeNumber(appointment.valor)) },
                        ]}
                        title={formatDateBr(appointment.data)}
                      />
                    ))}
                  </div>

                  <Card className="hidden overflow-hidden rounded-[22px] border border-slate-200/70 bg-white shadow-[0_4px_16px_rgba(15,23,36,0.05)] md:block">
                    <div className="border-b border-slate-200/70 px-5 py-4">
                      <p className="text-sm font-semibold text-ink">Agenda no periodo filtrado</p>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-sm">
                        <thead className="bg-slate-50 text-left text-slate-500">
                          <tr>
                            <th className="px-5 py-3 font-medium">Data</th>
                            <th className="px-5 py-3 font-medium">Cliente</th>
                            <th className="px-5 py-3 font-medium">Servico</th>
                            <th className="px-5 py-3 font-medium">Horario</th>
                            <th className="px-5 py-3 font-medium">Status</th>
                            <th className="px-5 py-3 font-medium text-right">Valor</th>
                          </tr>
                        </thead>
                        <tbody>
                          {agendaData.lists.upcomingAppointments.map((appointment) => (
                            <tr className="border-t border-slate-100" key={appointment.id}>
                              <td className="px-5 py-3 text-ink">{formatDateBr(appointment.data)}</td>
                              <td className="px-5 py-3 text-ink">{appointment.clienteNome}</td>
                              <td className="px-5 py-3 text-ink">{appointment.servicoNome}</td>
                              <td className="px-5 py-3 text-slate-500">
                                {appointment.horarioInicial} - {appointment.horarioFinal}
                              </td>
                              <td className="px-5 py-3">
                                <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
                                  {appointment.status}
                                </span>
                              </td>
                              <td className="px-5 py-3 text-right font-medium text-ink">
                                {currencyFormatter.format(safeNumber(appointment.valor))}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </Card>
                </>
              ) : (
                <EmptyState
                  detail="Ajuste os filtros para visualizar os atendimentos deste periodo."
                  message="Nenhum agendamento encontrado para a Agenda."
                />
              )}
            </>
          ) : null}
        </>
      ) : null}

      {activeView === "orcamentos" ? (
        <>
          {isQuotesLoading ? (
            <Card className="bg-white">
              <p className="text-sm text-slate-500">Carregando painel de orcamentos...</p>
            </Card>
          ) : null}

          {isQuotesError ? (
            <Card className="app-message-error">
              <p className="text-sm font-medium">{quotesError.message}</p>
            </Card>
          ) : null}

          {!isQuotesLoading && !isQuotesError ? (
            <>
              <div className="grid grid-cols-2 gap-3 xl:grid-cols-4 xl:gap-4">
                <MetricCard
                  icon={<CalendarIcon className="h-5 w-5 text-slate-500" />}
                  iconTone="bg-slate-100"
                  label="Orcamentos no periodo"
                  value={String(quotesSummary.total)}
                />
                <MetricCard
                  icon={<TrendIcon className="h-5 w-5 text-emerald-600" />}
                  iconTone="bg-emerald-50"
                  label="Fechados"
                  value={String(quotesSummary.approvedTotal)}
                />
                <MetricCard
                  icon={<ClockIcon className="h-5 w-5 text-amber-600" />}
                  iconTone="bg-amber-50"
                  label="Nao fechados"
                  value={String(quotesSummary.notClosedTotal)}
                />
                <MetricCard
                  icon={<MoneyIcon className="h-5 w-5 text-brand-600" />}
                  iconTone="bg-brand-50"
                  label="Valor fechado"
                  value={currencyFormatter.format(quotesSummary.approvedAmount)}
                />
              </div>

              <div className="grid gap-3 xl:grid-cols-2 xl:gap-4">
                <HighlightCard
                  icon={<UsersIcon className="h-5 w-5 text-brand-500" />}
                  iconTone="bg-brand-50"
                  name={quotesSummary.topClient?.nome ?? "Sem destaque"}
                  subtitle={`${quotesSummary.topClient?.total ?? 0} proposta(s) no recorte`}
                  title="Cliente com mais orcamentos"
                />
                <HighlightCard
                  icon={<TrendIcon className="h-5 w-5 text-emerald-600" />}
                  iconTone="bg-emerald-50"
                  name={`${quotesSummary.closeRate.toFixed(0)}%`}
                  subtitle={`${quotesSummary.openTotal} proposta(s) ainda em aberto`}
                  title="Taxa de fechamento"
                />
              </div>

              {filteredQuotes.length ? (
                <>
                  <div className="space-y-3 md:hidden">
                    {filteredQuotes.map((quote) => (
                      <MobileDataCard
                        badge={
                          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getQuoteStatusTone(quote.status)}`}>
                            {getQuoteStatusLabel(quote.status)}
                          </span>
                        }
                        key={quote.id}
                        rows={[
                          { label: "Criado em", value: formatDateTimeBr(quote.createdAt) },
                          { label: "Itens", value: String(quote.items.length) },
                          { label: "Valor", value: currencyFormatter.format(safeNumber(quote.total)) },
                        ]}
                        title={quote.clientName}
                      />
                    ))}
                  </div>

                  <Card className="hidden overflow-hidden rounded-[22px] border border-slate-200/70 bg-white shadow-[0_4px_16px_rgba(15,23,36,0.05)] md:block">
                    <div className="border-b border-slate-200/70 px-5 py-4">
                      <p className="text-sm font-semibold text-ink">Orcamentos no periodo filtrado</p>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-sm">
                        <thead className="bg-slate-50 text-left text-slate-500">
                          <tr>
                            <th className="px-5 py-3 font-medium">Cliente</th>
                            <th className="px-5 py-3 font-medium">Criado em</th>
                            <th className="px-5 py-3 font-medium">Itens</th>
                            <th className="px-5 py-3 font-medium">Status</th>
                            <th className="px-5 py-3 font-medium text-right">Valor</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredQuotes.map((quote) => (
                            <tr className="border-t border-slate-100" key={quote.id}>
                              <td className="px-5 py-3 text-ink">{quote.clientName}</td>
                              <td className="px-5 py-3 text-slate-500">{formatDateTimeBr(quote.createdAt)}</td>
                              <td className="px-5 py-3 text-ink">{quote.items.length}</td>
                              <td className="px-5 py-3">
                                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getQuoteStatusTone(quote.status)}`}>
                                  {getQuoteStatusLabel(quote.status)}
                                </span>
                              </td>
                              <td className="px-5 py-3 text-right font-medium text-ink">
                                {currencyFormatter.format(safeNumber(quote.total))}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </Card>
                </>
              ) : (
                <EmptyState
                  detail="Tente ampliar o periodo ou remover algum filtro para enxergar mais propostas."
                  message="Nenhum orcamento encontrado para esse recorte."
                />
              )}
            </>
          ) : null}
        </>
      ) : null}

      {activeView === "recorrencia" ? (
        <>
          {isRecurringLoading ? (
            <Card className="bg-white">
              <p className="text-sm text-slate-500">Carregando painel de recorrencia...</p>
            </Card>
          ) : null}

          {isRecurringError ? (
            <Card className="app-message-error">
              <p className="text-sm font-medium">{recurringError.message}</p>
            </Card>
          ) : null}

          {!isRecurringLoading && !isRecurringError ? (
            <>
              <div className="grid grid-cols-2 gap-3 xl:grid-cols-4 xl:gap-4">
                <MetricCard
                  icon={<MoneyIcon className="h-5 w-5 text-emerald-600" />}
                  iconTone="bg-emerald-50"
                  label="Valor Pago"
                  value={currencyFormatter.format(recurringSummary.paidAmount)}
                />
                <MetricCard
                  icon={<ClockIcon className="h-5 w-5 text-amber-600" />}
                  iconTone="bg-amber-50"
                  label="Valor Pendente"
                  value={currencyFormatter.format(recurringSummary.unpaidAmount)}
                />
                <MetricCard
                  icon={<TrendIcon className="h-5 w-5 text-brand-600" />}
                  iconTone="bg-brand-50"
                  label="Cobrancas Pagas"
                  value={String(recurringSummary.paidCount)}
                />
                <MetricCard
                  icon={<UsersIcon className="h-5 w-5 text-rose-600" />}
                  iconTone="bg-rose-50"
                  label="Cobrancas Nao Pagas"
                  value={String(recurringSummary.unpaidCount)}
                />
              </div>

              <div className="grid gap-3 xl:grid-cols-2 xl:gap-4">
                <HighlightCard
                  icon={<UsersIcon className="h-5 w-5 text-brand-500" />}
                  iconTone="bg-brand-50"
                  name={recurringSummary.topClient?.nome ?? "Sem destaque"}
                  subtitle={`${recurringSummary.topClient?.pago ?? 0} pago(s) e ${recurringSummary.topClient?.naoPago ?? 0} nao pago(s)`}
                  title="Cliente com mais cobrancas"
                />
                <HighlightCard
                  icon={<CalendarIcon className="h-5 w-5 text-slate-500" />}
                  iconTone="bg-slate-100"
                  name={String(recurringSummary.total)}
                  subtitle="cobranca(s) encontradas no periodo filtrado"
                  title="Volume de recorrencia"
                />
              </div>

              {recurringCharges.length ? (
                <>
                  <div className="space-y-3 md:hidden">
                    {recurringCharges.map((charge) => (
                      <MobileDataCard
                        badge={
                          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getRecurringStatusTone(charge.status)}`}>
                            {getRecurringStatusLabel(charge.status)}
                          </span>
                        }
                        key={charge.id}
                        rows={[
                          { label: "Servico", value: charge.serviceName },
                          { label: "Vencimento", value: formatDateBr(charge.dataVencimento) },
                          { label: "Valor", value: currencyFormatter.format(safeNumber(charge.valor)) },
                        ]}
                        title={charge.clientName}
                      />
                    ))}
                  </div>

                  <Card className="hidden overflow-hidden rounded-[22px] border border-slate-200/70 bg-white shadow-[0_4px_16px_rgba(15,23,36,0.05)] md:block">
                    <div className="border-b border-slate-200/70 px-5 py-4">
                      <p className="text-sm font-semibold text-ink">Recorrencia no periodo filtrado</p>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-sm">
                        <thead className="bg-slate-50 text-left text-slate-500">
                          <tr>
                            <th className="px-5 py-3 font-medium">Cliente</th>
                            <th className="px-5 py-3 font-medium">Servico</th>
                            <th className="px-5 py-3 font-medium">Vencimento</th>
                            <th className="px-5 py-3 font-medium">Pago?</th>
                            <th className="px-5 py-3 font-medium">Status</th>
                            <th className="px-5 py-3 font-medium text-right">Valor</th>
                          </tr>
                        </thead>
                        <tbody>
                          {recurringCharges.map((charge) => (
                            <tr className="border-t border-slate-100" key={charge.id}>
                              <td className="px-5 py-3 text-ink">{charge.clientName}</td>
                              <td className="px-5 py-3 text-ink">{charge.serviceName}</td>
                              <td className="px-5 py-3 text-slate-500">{formatDateBr(charge.dataVencimento)}</td>
                              <td className="px-5 py-3 text-ink">{charge.status === "pago" ? "Pago" : "Nao pago"}</td>
                              <td className="px-5 py-3">
                                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getRecurringStatusTone(charge.status)}`}>
                                  {getRecurringStatusLabel(charge.status)}
                                </span>
                              </td>
                              <td className="px-5 py-3 text-right font-medium text-ink">
                                {currencyFormatter.format(safeNumber(charge.valor))}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </Card>
                </>
              ) : (
                <EmptyState
                  detail="Ajuste as datas ou remova algum filtro para enxergar mais cobrancas recorrentes."
                  message="Nenhuma cobranca recorrente encontrada para esse recorte."
                />
              )}
            </>
          ) : null}
        </>
      ) : null}
    </section>
  );
}
