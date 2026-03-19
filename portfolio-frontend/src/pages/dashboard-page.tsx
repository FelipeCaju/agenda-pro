import { useMemo, useState, type ReactNode } from "react";
import { MobilePageHeader } from "@/components/layout/mobile-page-header";
import { Card } from "@/components/ui/card";
import {
  CalendarIcon,
  ChevronDownIcon,
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
import { getTodayDate } from "@/utils/agenda";

function getMonthStartDate() {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-01`;
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

function SelectField({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-sm text-slate-500">{label}</span>
      <div className="relative">
        <select
          className="app-select appearance-none pr-10"
          onChange={(event) => onChange(event.target.value)}
          value={value}
        >
          {children}
        </select>
        <ChevronDownIcon className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      </div>
    </label>
  );
}

export function DashboardPage() {
  const [startDate, setStartDate] = useState(getMonthStartDate());
  const [endDate, setEndDate] = useState(getTodayDate());
  const [clientId, setClientId] = useState("all");
  const [serviceId, setServiceId] = useState("all");
  const { data, error, isError, isLoading } = useDashboardSummary({
    period: "30d",
    status: "all",
  });
  const { data: clients = [] } = useClientsQuery();
  const { data: services = [] } = useServicesQuery();
  const { data: settings } = useSettingsQuery();

  const currencyFormatter = useMemo(
    () =>
      new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: settings?.moeda ?? "BRL",
      }),
    [settings?.moeda],
  );

  const topService = data?.charts.servicesByVolume[0];
  const topClient = useMemo(() => {
    if (!data?.lists.upcomingAppointments.length) {
      return null;
    }

    const counts = data.lists.upcomingAppointments.reduce<Record<string, { nome: string; total: number }>>(
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
  }, [data?.lists.upcomingAppointments]);

  return (
    <section className="space-y-4">
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

        <div className="mt-4 space-y-4">
          <SelectField label="Cliente" onChange={setClientId} value={clientId}>
            <option value="all">Todos os clientes</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.nome}
              </option>
            ))}
          </SelectField>

          <SelectField label="Servico" onChange={setServiceId} value={serviceId}>
            <option value="all">Todos os servicos</option>
            {services.map((service) => (
              <option key={service.id} value={service.id}>
                {service.nome}
              </option>
            ))}
          </SelectField>
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

      {data ? (
        <>
          <div className="grid grid-cols-2 gap-3">
            <MetricCard
              icon={<MoneyIcon className="h-5 w-5 text-emerald-600" />}
              iconTone="bg-emerald-50"
              label="Valor Recebido"
              value={currencyFormatter.format(data.kpis.scheduledRevenue)}
            />
            <MetricCard
              icon={<ClockIcon className="h-5 w-5 text-brand-600" />}
              iconTone="bg-brand-50"
              label="Valor a Receber"
              value={currencyFormatter.format(data.kpis.averageTicket * data.kpis.pendingAppointments)}
            />
            <MetricCard
              icon={<CalendarIcon className="h-5 w-5 text-slate-500" />}
              iconTone="bg-slate-100"
              label="Total de Atendimentos"
              value={String(data.kpis.totalAppointments)}
            />
            <MetricCard
              icon={<TrendIcon className="h-5 w-5 text-violet-600" />}
              iconTone="bg-violet-50"
              label="Ticket Medio"
              value={currencyFormatter.format(data.kpis.averageTicket)}
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
            subtitle={`${topClient?.total ?? 0} atendimento(s)`}
            title="Cliente mais frequente"
          />
        </>
      ) : null}
    </section>
  );
}
