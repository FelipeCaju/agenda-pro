import { useMemo, useState, type ReactNode } from "react";
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
import { useDashboardSummary } from "@/hooks/use-dashboard-summary";
import { useSettingsQuery } from "@/hooks/use-settings-query";
import { getTodayDate } from "@/utils/agenda";

function getMonthStartDate() {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-01`;
}

function safeNumber(value: unknown) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
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
    <Card className="rounded-[22px] border border-slate-200/70 bg-white px-4 py-4 shadow-[0_4px_16px_rgba(15,23,36,0.05)]">
      <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${iconTone}`}>{icon}</div>
      <p className="mt-6 text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-[2rem] font-semibold tracking-[-0.04em] text-ink">{value}</p>
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
    <Card className="rounded-[22px] border border-slate-200/70 bg-white px-4 py-4 shadow-[0_4px_16px_rgba(15,23,36,0.05)]">
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

function ServiceFinanceChart({
  items,
  selectedServiceId,
  currencyFormatter,
  onSelect,
}: {
  items: Array<{
    serviceId: string;
    nome: string;
    cor: string;
    totalAppointments: number;
    paidRevenue: number;
    pendingRevenue: number;
  }>;
  selectedServiceId: string | null;
  currencyFormatter: Intl.NumberFormat;
  onSelect: (serviceId: string | null) => void;
}) {
  const maxTotal = Math.max(
    ...items.map((item) => item.paidRevenue + item.pendingRevenue),
    1,
  );

  return (
    <Card className="rounded-[22px] border border-slate-200/70 bg-white px-4 py-4 shadow-[0_4px_16px_rgba(15,23,36,0.05)]">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-semibold text-ink">Financeiro por servico</p>
        {selectedServiceId ? (
          <button
            className="rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600"
            onClick={() => onSelect(null)}
            type="button"
          >
            Limpar
          </button>
        ) : null}
      </div>

      <div className="mt-5 space-y-4">
        {!items.length ? (
          <div className="rounded-[18px] bg-slate-50 px-4 py-4 text-sm text-slate-500">
            Nenhum servico com movimentacao no periodo selecionado.
          </div>
        ) : null}

        {items.map((item) => {
          const total = item.paidRevenue + item.pendingRevenue;
          const paidWidth = total > 0 ? (item.paidRevenue / maxTotal) * 100 : 0;
          const pendingWidth = total > 0 ? (item.pendingRevenue / maxTotal) * 100 : 0;
          const isSelected = selectedServiceId === item.serviceId;

          return (
            <button
              className={`block w-full rounded-[18px] border px-3 py-3 text-left transition ${
                isSelected
                  ? "border-brand-200 bg-brand-50/70 shadow-[0_10px_22px_rgba(29,140,248,0.14)]"
                  : "border-slate-100 bg-slate-50/70"
              }`}
              key={item.serviceId}
              onClick={() => onSelect(isSelected ? null : item.serviceId)}
              type="button"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-3 w-3 shrink-0 rounded-full"
                      style={{ backgroundColor: item.cor || "#1d8cf8" }}
                    />
                    <p className="truncate text-sm font-semibold text-ink">{item.nome}</p>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    {item.totalAppointments} atendimento(s)
                  </p>
                </div>
                <p className="text-right text-xs font-medium text-slate-500">
                  {currencyFormatter.format(total)}
                </p>
              </div>

              <div className="mt-3 flex h-3 overflow-hidden rounded-full bg-slate-200">
                <div
                  className="rounded-l-full bg-emerald-500"
                  style={{ width: `${paidWidth}%` }}
                />
                <div
                  className="rounded-r-full bg-amber-400"
                  style={{ width: `${pendingWidth}%` }}
                />
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                <span>Recebido: {currencyFormatter.format(item.paidRevenue)}</span>
                <span>A receber: {currencyFormatter.format(item.pendingRevenue)}</span>
              </div>
            </button>
          );
        })}
      </div>
    </Card>
  );
}

export function DashboardPage() {
  const [startDate, setStartDate] = useState(getMonthStartDate());
  const [endDate, setEndDate] = useState(getTodayDate());
  const { data, error, isError, isLoading } = useDashboardSummary({
    period: "30d",
    status: "all",
    startDate,
    endDate,
  });
  const { data: settings } = useSettingsQuery();
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);

  const currencyFormatter = useMemo(
    () =>
      new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: settings?.moeda ?? "BRL",
      }),
    [settings?.moeda],
  );

  const serviceFinancialItems = useMemo(
    () => data?.charts.servicesFinancial ?? [],
    [data?.charts.servicesFinancial],
  );

  const totalPaidRevenue = useMemo(
    () =>
      serviceFinancialItems.reduce((total, item) => total + safeNumber(item.paidRevenue), 0),
    [serviceFinancialItems],
  );

  const totalPendingRevenue = useMemo(
    () =>
      serviceFinancialItems.reduce((total, item) => total + safeNumber(item.pendingRevenue), 0),
    [serviceFinancialItems],
  );

  const totalServiceAppointments = useMemo(
    () =>
      serviceFinancialItems.reduce(
        (total, item) => total + safeNumber(item.totalAppointments),
        0,
      ),
    [serviceFinancialItems],
  );

  const selectedServiceFinancial = useMemo(
    () =>
      serviceFinancialItems.find((item) => item.serviceId === selectedServiceId) ?? null,
    [selectedServiceId, serviceFinancialItems],
  );

  const displayedAppointments = useMemo(() => {
    const appointments = data?.lists.upcomingAppointments ?? [];
    if (!selectedServiceId) {
      return appointments;
    }

    return appointments.filter((appointment) => appointment.servicoId === selectedServiceId);
  }, [data?.lists.upcomingAppointments, selectedServiceId]);

  const topService = useMemo(() => {
    if (selectedServiceFinancial) {
      return {
        nome: selectedServiceFinancial.nome,
        total: selectedServiceFinancial.totalAppointments,
      };
    }

    return data?.charts.servicesByVolume[0] ?? null;
  }, [data?.charts.servicesByVolume, selectedServiceFinancial]);

  const topClient = useMemo(() => {
    if (!displayedAppointments.length) {
      return null;
    }

    const counts = displayedAppointments.reduce<Record<string, { nome: string; total: number }>>(
      (acc, appointment) => {
        const key = appointment.clienteId;
        const current = acc[key] ?? { nome: appointment.clienteNome, total: 0 };
        current.total += 1;
        acc[key] = current;
        return acc;
      },
      {},
    );

    return Object.values(counts).sort((left, right) => right.total - left.total)[0] ?? null;
  }, [displayedAppointments]);

  const displayedKpis = useMemo(() => {
    if (!data) {
      return null;
    }

    if (!selectedServiceFinancial) {
      return {
        receivedRevenue: totalPaidRevenue,
        pendingRevenue: totalPendingRevenue,
        totalAppointments: totalServiceAppointments || safeNumber(data.kpis.totalAppointments),
        averageTicket: safeNumber(data.kpis.averageTicket),
      };
    }

    return {
      receivedRevenue: safeNumber(selectedServiceFinancial.paidRevenue),
      pendingRevenue: safeNumber(selectedServiceFinancial.pendingRevenue),
      totalAppointments: safeNumber(selectedServiceFinancial.totalAppointments),
      averageTicket:
        safeNumber(selectedServiceFinancial.totalAppointments) > 0
          ? (safeNumber(selectedServiceFinancial.paidRevenue) +
              safeNumber(selectedServiceFinancial.pendingRevenue)) /
            safeNumber(selectedServiceFinancial.totalAppointments)
          : 0,
    };
  }, [
    data,
    selectedServiceFinancial,
    totalPaidRevenue,
    totalPendingRevenue,
    totalServiceAppointments,
  ]);

  return (
    <section className="space-y-4 pb-24">
      <MobilePageHeader subtitle="Visao geral do negocio" title="Painel" />

      <Card className="rounded-[22px] border border-slate-200/70 bg-white px-4 py-4 shadow-[0_4px_16px_rgba(15,23,36,0.05)]">
        <p className="text-sm font-semibold text-ink">Filtros</p>

        <div className="mt-5 grid grid-cols-2 gap-3">
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
        </div>

        <div className="mt-4 flex items-center justify-between rounded-[18px] bg-slate-50 px-3 py-3 text-xs font-medium text-slate-600">
          <span>Periodo</span>
          <span>
            {data?.range.start ?? startDate} ate {data?.range.end ?? endDate}
          </span>
        </div>
      </Card>

      {isLoading ? (
        <Card className="bg-white">
          <p className="text-sm text-slate-500">Carregando painel...</p>
        </Card>
      ) : null}

      {isError ? (
        <Card className="app-message-error">
          <p className="text-sm font-medium">{error.message}</p>
        </Card>
      ) : null}

      {data && displayedKpis ? (
        <>
          <ServiceFinanceChart
            currencyFormatter={currencyFormatter}
            items={serviceFinancialItems}
            onSelect={setSelectedServiceId}
            selectedServiceId={selectedServiceId}
          />

          {!serviceFinancialItems.length ? (
            <Card className="rounded-[22px] border border-slate-200/70 bg-white px-4 py-4 shadow-[0_4px_16px_rgba(15,23,36,0.05)]">
              <p className="text-sm font-semibold text-ink">Sem dados no periodo</p>
            </Card>
          ) : null}

          <div className="grid grid-cols-2 gap-3">
            <MetricCard
              icon={<MoneyIcon className="h-5 w-5 text-emerald-600" />}
              iconTone="bg-emerald-50"
              label="Valor Recebido"
              value={currencyFormatter.format(displayedKpis.receivedRevenue)}
            />
            <MetricCard
              icon={<ClockIcon className="h-5 w-5 text-brand-600" />}
              iconTone="bg-brand-50"
              label="Valor a Receber"
              value={currencyFormatter.format(displayedKpis.pendingRevenue)}
            />
            <MetricCard
              icon={<CalendarIcon className="h-5 w-5 text-slate-500" />}
              iconTone="bg-slate-100"
              label="Total de Atendimentos"
              value={String(displayedKpis.totalAppointments)}
            />
            <MetricCard
              icon={<TrendIcon className="h-5 w-5 text-violet-600" />}
              iconTone="bg-violet-50"
              label="Ticket Medio"
              value={currencyFormatter.format(displayedKpis.averageTicket)}
            />
          </div>

          <HighlightCard
            icon={<ScissorsIcon className="h-5 w-5 text-amber-500" />}
            iconTone="bg-amber-50"
            name={topService?.nome ?? "Sem destaque"}
            subtitle={`${topService?.total ?? 0} atendimento(s)`}
            title="Servico mais realizado"
          />

          <HighlightCard
            icon={<UsersIcon className="h-5 w-5 text-brand-500" />}
            iconTone="bg-brand-50"
            name={topClient?.nome ?? "Sem destaque"}
            subtitle={`${topClient?.total ?? 0} atendimento(s) no recorte atual`}
            title={selectedServiceId ? "Cliente em destaque" : "Cliente mais frequente"}
          />
        </>
      ) : null}
    </section>
  );
}
