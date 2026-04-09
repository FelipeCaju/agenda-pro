import { startTransition, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { DayView } from "@/components/agenda/day-view";
import { MonthView } from "@/components/agenda/month-view";
import { PullToRefresh } from "@/components/agenda/pull-to-refresh";
import { WeekView } from "@/components/agenda/week-view";
import { Card } from "@/components/ui/card";
import { FloatingActionButton } from "@/components/ui/floating-action-button";
import { ChevronDownIcon } from "@/components/ui/icons";
import { useAgendaQuery } from "@/hooks/use-agenda-query";
import { useBlockedSlotsQuery } from "@/hooks/use-blocked-slots-query";
import { useProfessionalsQuery } from "@/hooks/use-professionals-query";
import { useSettingsQuery } from "@/hooks/use-settings-query";
import type { AgendaView, Appointment } from "@/services/appointmentService";
import { addDays, formatAgendaHeroDate, getTodayDate, getWeekDates } from "@/utils/agenda";
import { formatDateBR } from "@/utils/date";

type AgendaLocationState = {
  successMessage?: string;
  selectedDate?: string;
  selectedTime?: string;
  notificationSlotKey?: string;
  notificationAppointmentIds?: string[];
};

const viewOptions: Array<{ value: AgendaView; label: string }> = [
  { value: "day", label: "Dia" },
  { value: "week", label: "Semana" },
  { value: "month", label: "Mes" },
];

function ArrowButton({
  direction,
  onClick,
}: {
  direction: "left" | "right";
  onClick: () => void;
}) {
  return (
    <button
      className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-slate-500 shadow-sm transition hover:text-brand-700"
      onClick={onClick}
      type="button"
    >
      <svg
        className="h-4 w-4"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        {direction === "left" ? <path d="m15 6-6 6 6 6" /> : <path d="m9 6 6 6-6 6" />}
      </svg>
    </button>
  );
}

function formatDesktopPeriodLabel(view: AgendaView, selectedDate: string) {
  const baseDate = new Date(`${selectedDate}T12:00:00`);

  if (view === "week") {
    const weekDates = getWeekDates(selectedDate);
    const start = formatDateBR(weekDates[0]);
    const end = formatDateBR(weekDates[weekDates.length - 1]);
    return `Semana de ${start} a ${end}`;
  }

  if (view === "month") {
    return new Intl.DateTimeFormat("pt-BR", {
      month: "long",
      year: "numeric",
    }).format(baseDate);
  }

  return new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(baseDate);
}

export function AgendaPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = location.state as AgendaLocationState | null;
  const [view, setView] = useState<AgendaView>(locationState?.selectedDate ? "day" : "day");
  const [selectedDate, setSelectedDate] = useState(locationState?.selectedDate ?? getTodayDate());
  const [selectedProfessionalId, setSelectedProfessionalId] = useState("");
  const [successMessage, setSuccessMessage] = useState(locationState?.successMessage ?? "");
  const [notificationMessage, setNotificationMessage] = useState(
    locationState?.notificationAppointmentIds?.length
      ? "Mostrando os atendimentos do lembrete recebido."
      : "",
  );
  const [highlightedAppointmentIds, setHighlightedAppointmentIds] = useState<string[]>(
    locationState?.notificationAppointmentIds ?? [],
  );
  const { data: professionals = [] } = useProfessionalsQuery();
  const { data: settings } = useSettingsQuery();
  const { data = [], error, isLoading, isError, isFetching, refetch } = useAgendaQuery({
    date: selectedDate,
    view,
    professionalId: selectedProfessionalId || undefined,
  });
  const { data: blockedSlots = [] } = useBlockedSlotsQuery({
    date: selectedDate,
    view,
    professionalId: selectedProfessionalId || undefined,
  });

  useEffect(() => {
    if (!successMessage) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setSuccessMessage("");
      navigate(location.pathname, { replace: true, state: null });
    }, 3000);

    return () => window.clearTimeout(timeoutId);
  }, [location.pathname, navigate, successMessage]);

  useEffect(() => {
    if (!locationState?.selectedDate) {
      return;
    }

    startTransition(() => {
      setSelectedDate(locationState.selectedDate ?? getTodayDate());
      setView("day");
      setHighlightedAppointmentIds(locationState.notificationAppointmentIds ?? []);
      setNotificationMessage(
        locationState.notificationAppointmentIds?.length
          ? "Mostrando os atendimentos do lembrete recebido."
          : "",
      );
    });

    navigate(location.pathname, {
      replace: true,
      state: {
        successMessage: locationState.successMessage,
      },
    });
  }, [
    location.pathname,
    locationState?.notificationAppointmentIds,
    locationState?.selectedDate,
    locationState?.successMessage,
    navigate,
  ]);

  useEffect(() => {
    if (!notificationMessage && !highlightedAppointmentIds.length) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setNotificationMessage("");
      setHighlightedAppointmentIds([]);
    }, 8000);

    return () => window.clearTimeout(timeoutId);
  }, [highlightedAppointmentIds, notificationMessage]);

  const heroDateLabel = useMemo(() => formatAgendaHeroDate(selectedDate), [selectedDate]);
  const desktopPeriodLabel = useMemo(() => formatDesktopPeriodLabel(view, selectedDate), [selectedDate, view]);
  const isToday = selectedDate === getTodayDate();
  const agendaStartHour = settings?.horaInicioAgenda ?? "08:00";
  const agendaEndHour = settings?.horaFimAgenda ?? "18:00";
  const selectedProfessionalName =
    professionals.find((professional) => professional.id === selectedProfessionalId)?.nome ?? "Equipe completa";
  const headerStats = [
    {
      label: view === "month" ? "Itens no periodo" : "Atendimentos",
      value: String(data.length),
    },
    {
      label: "Bloqueios",
      value: String(blockedSlots.length),
    },
    {
      label: "Janela",
      value: `${agendaStartHour} - ${agendaEndHour}`,
    },
  ];
  const agendaTimezoneLabel = useMemo(() => {
    const timezone = settings?.timezone;

    if (!timezone) {
      return "GMT-03";
    }

    try {
      const parts = new Intl.DateTimeFormat("en-US", {
        timeZone: timezone,
        timeZoneName: "shortOffset",
      }).formatToParts(new Date());
      const zonePart = parts.find((part) => part.type === "timeZoneName")?.value;
      return zonePart?.replace("GMT", "GMT") ?? timezone;
    } catch {
      return timezone;
    }
  }, [settings?.timezone]);

  function navigateDate(direction: "prev" | "next") {
    const amount = direction === "next" ? 1 : -1;
    const days = view === "month" ? 30 : view === "week" ? 7 : 1;

    startTransition(() => {
      setSelectedDate((current) => addDays(current, amount * days));
    });
  }

  function openAppointment(appointment: Appointment) {
    navigate(`/agenda/${appointment.id}`);
  }

  function openNewAppointmentFromGrid(payload: { date: string; time: string }) {
    navigate("/agenda/novo", {
      state: {
        selectedDate: payload.date,
        selectedTime: payload.time,
      },
    });
  }

  return (
    <PullToRefresh isRefreshing={isFetching} onRefresh={refetch}>
      <section className="space-y-4 pb-2 xl:space-y-5 xl:pb-0">
        <div>
          <div
            className="sticky top-0 z-[55] -mx-3 space-y-4 border-b border-slate-100 bg-white/95 px-3 pb-4 backdrop-blur-xl sm:-mx-4 sm:px-4 xl:hidden"
            style={{ paddingTop: "env(safe-area-inset-top)" }}
          >
            <div className="flex items-center justify-between gap-3 xl:gap-6">
              <div>
                <p className="text-[1.9rem] font-bold tracking-[-0.04em] text-ink xl:text-[2.3rem]">{heroDateLabel}</p>
              </div>

              <div className="flex items-center gap-2 xl:gap-3">
                <button
                  className={`rounded-full px-3 py-1.5 text-sm font-semibold transition xl:px-4 xl:py-2 ${
                    isToday ? "bg-brand-50 text-brand-700" : "bg-white text-slate-500 shadow-sm"
                  }`}
                  onClick={() => startTransition(() => setSelectedDate(getTodayDate()))}
                  type="button"
                >
                  Hoje
                </button>
                <ArrowButton direction="left" onClick={() => navigateDate("prev")} />
                <ArrowButton direction="right" onClick={() => navigateDate("next")} />
              </div>
            </div>

            <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_320px] xl:items-center">
              <div className="rounded-[18px] bg-white/70 p-1.5 shadow-sm">
                <div className="grid grid-cols-3 gap-1.5">
                  {viewOptions.map((option) => (
                    <button
                      className={`rounded-[14px] px-3 py-2.5 text-sm font-semibold transition xl:py-3 ${
                        view === option.value
                          ? "bg-brand-500 text-white shadow-soft"
                          : "text-slate-500"
                      }`}
                      key={option.value}
                      onClick={() => startTransition(() => setView(option.value))}
                      type="button"
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="relative">
                <select
                  className="app-select appearance-none bg-white pr-10 text-sm"
                  onChange={(event) => setSelectedProfessionalId(event.target.value)}
                  value={selectedProfessionalId}
                >
                  <option value="">Todos os profissionais</option>
                  {professionals.map((professional) => (
                    <option key={professional.id} value={professional.id}>
                      {professional.nome}
                    </option>
                  ))}
                </select>
                <ChevronDownIcon className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              </div>
            </div>
          </div>

          <Card className="mt-0 hidden border-slate-200/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(244,248,252,0.96))] p-7 shadow-[0_26px_55px_rgba(15,23,42,0.08)] xl:block xl:mt-0">
          <div className="flex items-start justify-between gap-8">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-brand-700">Agenda de trabalho</p>
              <div className="mt-3 flex items-end gap-4">
                <p className="text-[2.8rem] font-bold tracking-[-0.06em] text-ink">{heroDateLabel}</p>
                <p className="pb-2 text-sm text-slate-500">{desktopPeriodLabel}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                className={`rounded-full px-4 py-2.5 text-sm font-semibold transition ${
                  isToday ? "bg-brand-50 text-brand-700" : "bg-white text-slate-500 shadow-sm"
                }`}
                onClick={() => startTransition(() => setSelectedDate(getTodayDate()))}
                type="button"
              >
                Hoje
              </button>
              <ArrowButton direction="left" onClick={() => navigateDate("prev")} />
              <ArrowButton direction="right" onClick={() => navigateDate("next")} />
              <button
                className="ml-2 inline-flex h-12 items-center justify-center rounded-[18px] bg-brand-500 px-6 text-sm font-semibold text-white shadow-[0_16px_30px_rgba(29,140,248,0.22)] transition hover:bg-brand-600"
                onClick={() => navigate("/agenda/novo", { state: { selectedDate } })}
                type="button"
              >
                Novo agendamento
              </button>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-[minmax(0,340px)_240px_1fr] items-center gap-4">
            <div className="relative">
              <select
                className="app-select h-14 appearance-none bg-white pr-10 text-sm"
                onChange={(event) => setSelectedProfessionalId(event.target.value)}
                value={selectedProfessionalId}
              >
                <option value="">Todos os profissionais</option>
                {professionals.map((professional) => (
                  <option key={professional.id} value={professional.id}>
                    {professional.nome}
                  </option>
                ))}
              </select>
              <ChevronDownIcon className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            </div>

            <div className="rounded-[18px] bg-white/80 p-1.5 shadow-[0_10px_24px_rgba(15,23,42,0.05)]">
              <div className="grid grid-cols-3 gap-1.5">
                {viewOptions.map((option) => (
                  <button
                    className={`rounded-[14px] px-3 py-2.5 text-sm font-semibold transition ${
                      view === option.value
                        ? "bg-brand-500 text-white shadow-soft"
                        : "text-slate-500 hover:bg-slate-50"
                    }`}
                    key={option.value}
                    onClick={() => startTransition(() => setView(option.value))}
                    type="button"
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-4 gap-3">
              {headerStats.map((item) => (
                <div
                  className="rounded-[20px] border border-slate-200/80 bg-white/90 px-4 py-4 text-left shadow-[0_12px_24px_rgba(15,23,42,0.05)]"
                  key={item.label}
                >
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">{item.label}</p>
                  <p className="mt-2 text-[1.65rem] font-semibold tracking-[-0.05em] text-ink">{item.value}</p>
                </div>
              ))}
              <div className="rounded-[20px] border border-slate-200/80 bg-slate-950/[0.03] px-4 py-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Contexto</p>
                <p className="mt-2 text-base font-semibold text-ink">{selectedProfessionalName}</p>
                <p className="mt-1 text-xs text-slate-500">{agendaTimezoneLabel}</p>
              </div>
            </div>
          </div>
          </Card>
        </div>

        {successMessage ? (
          <Card className="app-message-success">
            <p className="text-sm font-medium text-emerald-700">{successMessage}</p>
          </Card>
        ) : null}

        {notificationMessage ? (
          <Card className="border-brand-100 bg-brand-50/80">
            <p className="text-sm font-medium text-brand-700">{notificationMessage}</p>
          </Card>
        ) : null}

        {blockedSlots.length ? (
          <Card className="border-amber-100 bg-amber-50/60 xl:hidden">
            <p className="text-xs uppercase tracking-[0.18em] text-amber-700">Bloqueios na visualizacao</p>
            <p className="mt-2 text-sm text-amber-900/80">
              Os horarios bloqueados agora aparecem diretamente na grade. Ha {blockedSlots.length} bloqueio(s) no periodo exibido.
            </p>
          </Card>
        ) : null}

        {isLoading ? (
          <Card>
            <p className="text-sm text-slate-500">Carregando agenda...</p>
          </Card>
        ) : null}
        {isError ? (
          <Card className="app-message-error">
            <p className="text-sm font-medium">{error.message}</p>
          </Card>
        ) : null}

        {!isLoading && !isError ? (
          view === "day" ? (
            <DayView
              appointments={data}
              blockedSlots={blockedSlots}
              endHour={agendaEndHour}
              highlightedAppointmentIds={highlightedAppointmentIds}
              onCreateAppointment={openNewAppointmentFromGrid}
              onOpenAppointment={openAppointment}
              selectedDate={selectedDate}
              startHour={agendaStartHour}
              timezoneLabel={agendaTimezoneLabel}
            />
          ) : view === "week" ? (
            <WeekView
              appointments={data}
              blockedSlots={blockedSlots}
              endHour={agendaEndHour}
              highlightedAppointmentIds={highlightedAppointmentIds}
              onCreateAppointment={openNewAppointmentFromGrid}
              onOpenAppointment={openAppointment}
              onSelectDate={(date) => startTransition(() => setSelectedDate(date))}
              selectedDate={selectedDate}
              startHour={agendaStartHour}
              timezoneLabel={agendaTimezoneLabel}
            />
          ) : (
            <MonthView
              appointments={data}
              onOpenDate={(date) => {
                startTransition(() => {
                  setSelectedDate(date);
                  setView("day");
                });
              }}
              selectedDate={selectedDate}
            />
          )
        ) : null}

        <FloatingActionButton
          className="xl:hidden"
          label="Novo"
          onClick={() => navigate("/agenda/novo", { state: { selectedDate } })}
        />
      </section>
    </PullToRefresh>
  );
}
