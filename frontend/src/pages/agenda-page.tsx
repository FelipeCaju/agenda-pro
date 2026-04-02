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
import type { AgendaView, Appointment } from "@/services/appointmentService";
import { addDays, formatAgendaHeroDate, getTodayDate } from "@/utils/agenda";
import { formatDateBR } from "@/utils/date";

type AgendaLocationState = {
  successMessage?: string;
  selectedDate?: string;
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
  const isToday = selectedDate === getTodayDate();

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

  return (
    <PullToRefresh isRefreshing={isFetching} onRefresh={refetch}>
      <section className="space-y-4 pb-2 xl:space-y-5">
        <div
          className="sticky top-0 z-[55] -mx-3 space-y-4 border-b border-slate-100 bg-white/95 px-3 pb-4 backdrop-blur-xl sm:-mx-4 sm:px-4 xl:static xl:mx-0 xl:space-y-5 xl:border-b-0 xl:bg-transparent xl:px-0 xl:pb-1 xl:backdrop-blur-none"
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
          <Card>
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Bloqueios</p>
            <div className="mt-3 space-y-2">
              {blockedSlots.map((slot) => (
                <div
                  className="rounded-2xl border border-slate-100 bg-slate-50/80 px-3 py-3"
                  key={slot.id}
                >
                  <p className="font-medium text-ink">
                    {formatDateBR(slot.data)} - {slot.horarioInicial} - {slot.horarioFinal}
                  </p>
                  <p className="text-sm text-slate-500">{slot.motivo || "Horario bloqueado"}</p>
                </div>
              ))}
            </div>
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
              highlightedAppointmentIds={highlightedAppointmentIds}
              onOpenAppointment={openAppointment}
              selectedDate={selectedDate}
            />
          ) : view === "week" ? (
            <WeekView
              appointments={data}
              highlightedAppointmentIds={highlightedAppointmentIds}
              onOpenAppointment={openAppointment}
              onSelectDate={(date) => startTransition(() => setSelectedDate(date))}
              selectedDate={selectedDate}
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
          label="Novo"
          onClick={() => navigate("/agenda/novo", { state: { selectedDate } })}
        />
      </section>
    </PullToRefresh>
  );
}
