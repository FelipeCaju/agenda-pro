import { useEffect, useRef, useState, type ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/utils/cn";
import type { BlockedSlot } from "@/services/blockedSlotService";
import type { Appointment } from "@/services/appointmentService";
import { getAppointmentServiceColor, getAppointmentServiceLabel } from "@/utils/appointment";
import { formatTimeRange, getTodayDate } from "@/utils/agenda";

const HOUR_ROW_HEIGHT = 76;
const TIME_COLUMN_WIDTH = 64;

type TimeGridProps = {
  dates: string[];
  appointments: Appointment[];
  blockedSlots?: BlockedSlot[];
  highlightedAppointmentIds?: string[];
  onOpenAppointment: (appointment: Appointment) => void;
  onCreateAppointment?: (payload: { date: string; time: string }) => void;
  onSelectDate?: (date: string) => void;
  selectedDate: string;
  startHour: string;
  endHour: string;
  timezoneLabel: string;
  emptyState?: ReactNode;
};

type PositionedAppointment = {
  appointment: Appointment;
  lane: number;
  laneCount: number;
};

type PositionedBlockedSlot = {
  slot: BlockedSlot;
  start: number;
  end: number;
};

function timeToMinutes(time: string) {
  const [hours, minutes] = time.slice(0, 5).split(":").map(Number);
  return hours * 60 + minutes;
}

function roundHourStart(time: string) {
  return Math.floor(timeToMinutes(time) / 60) * 60;
}

function roundHourEnd(time: string) {
  return Math.ceil(timeToMinutes(time) / 60) * 60;
}

function formatHour(minutes: number) {
  const hours = Math.floor(minutes / 60);
  return `${String(hours).padStart(2, "0")}:00`;
}

function formatTime(minutes: number) {
  const normalized = Math.max(0, minutes);
  const hours = Math.floor(normalized / 60);
  const valueMinutes = normalized % 60;
  return `${String(hours).padStart(2, "0")}:${String(valueMinutes).padStart(2, "0")}`;
}

function formatDayLabel(date: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    weekday: "short",
  })
    .format(new Date(`${date}T12:00:00`))
    .replace(".", "")
    .toUpperCase();
}

function formatDayNumber(date: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "numeric",
  }).format(new Date(`${date}T12:00:00`));
}

function formatShortDate(date: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date(`${date}T12:00:00`));
}

function buildPosition(startMinutes: number, endMinutes: number, rangeStart: number, totalMinutes: number) {
  const safeStart = Math.max(startMinutes, rangeStart);
  const safeEnd = Math.max(endMinutes, safeStart + 15);
  const top = ((safeStart - rangeStart) / totalMinutes) * 100;
  const height = Math.max(((safeEnd - safeStart) / totalMinutes) * 100, 3.2);

  return { top, height };
}

function layoutOverlappingAppointments(appointments: Appointment[]) {
  const sorted = [...appointments].sort((left, right) => {
    const startDiff = timeToMinutes(left.horarioInicial) - timeToMinutes(right.horarioInicial);
    if (startDiff !== 0) {
      return startDiff;
    }

    return timeToMinutes(left.horarioFinal) - timeToMinutes(right.horarioFinal);
  });

  const groups: Appointment[][] = [];
  let currentGroup: Appointment[] = [];
  let currentGroupEnd = -1;

  sorted.forEach((appointment) => {
    const start = timeToMinutes(appointment.horarioInicial);
    const end = timeToMinutes(appointment.horarioFinal);

    if (!currentGroup.length || start < currentGroupEnd) {
      currentGroup.push(appointment);
      currentGroupEnd = Math.max(currentGroupEnd, end);
      return;
    }

    groups.push(currentGroup);
    currentGroup = [appointment];
    currentGroupEnd = end;
  });

  if (currentGroup.length) {
    groups.push(currentGroup);
  }

  return groups.flatMap((group) => {
    const laneEnds: number[] = [];
    const positioned: PositionedAppointment[] = [];

    group.forEach((appointment) => {
      const start = timeToMinutes(appointment.horarioInicial);
      const end = timeToMinutes(appointment.horarioFinal);
      let lane = laneEnds.findIndex((laneEnd) => laneEnd <= start);

      if (lane === -1) {
        lane = laneEnds.length;
      }

      laneEnds[lane] = end;
      positioned.push({
        appointment,
        lane,
        laneCount: 0,
      });
    });

    const laneCount = Math.max(laneEnds.length, 1);
    return positioned.map((item) => ({
      ...item,
      laneCount,
    }));
  });
}

function getTimezoneLabel(timezoneLabel: string) {
  return timezoneLabel || "Horario local";
}

function AppointmentBlock({
  appointment,
  position,
  isHighlighted,
  lane,
  laneCount,
  onOpen,
}: {
  appointment: Appointment;
  position: { top: number; height: number };
  isHighlighted: boolean;
  lane: number;
  laneCount: number;
  onOpen: (appointment: Appointment) => void;
}) {
  const width = `calc(${100 / laneCount}% - 6px)`;
  const left = `calc(${(100 / laneCount) * lane}% + 3px)`;
  const isTiny = position.height < 5.6;
  const isCompact = position.height < 9;

  return (
    <button
      className={cn(
        "absolute z-20 overflow-hidden rounded-[18px] border px-3 py-2 text-left shadow-[0_10px_24px_rgba(15,23,42,0.14)] transition hover:brightness-[0.98]",
        isHighlighted
          ? "ring-2 ring-brand-200 ring-offset-2 ring-offset-white"
          : "ring-1 ring-white/40",
      )}
      onClick={() => onOpen(appointment)}
      style={{
        top: `${position.top}%`,
        height: `${position.height}%`,
        left,
        width,
        backgroundColor: getAppointmentServiceColor(appointment),
        borderColor: "rgba(255,255,255,0.32)",
      }}
      type="button"
    >
      <div className="flex h-full min-h-0 flex-col justify-between gap-1">
        <div className="min-h-0">
          <p className="truncate text-sm font-semibold text-white">{getAppointmentServiceLabel(appointment)}</p>
          {!isTiny ? (
            <p className="truncate text-[12px] font-medium text-white/92">{appointment.clienteNome}</p>
          ) : null}
        </div>

        {!isCompact ? (
          <p className="truncate text-[12px] font-semibold text-white/95">{formatTimeRange(appointment)}</p>
        ) : !isTiny ? (
          <p className="truncate text-[12px] font-semibold text-white/95">{appointment.horarioInicial}</p>
        ) : null}
      </div>
    </button>
  );
}

export function TimeGrid({
  dates,
  appointments,
  blockedSlots = [],
  highlightedAppointmentIds = [],
  onOpenAppointment,
  onCreateAppointment,
  onSelectDate,
  selectedDate,
  startHour,
  endHour,
  timezoneLabel,
  emptyState,
}: TimeGridProps) {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [mobileCardHeight, setMobileCardHeight] = useState<number | null>(null);
  const rangeStart = roundHourStart(startHour);
  const rangeEnd = Math.max(roundHourEnd(endHour), rangeStart + 60);
  const totalMinutes = rangeEnd - rangeStart;
  const dayColumnMinWidth = dates.length === 1 ? 320 : 220;
  const gridTemplateColumns = `${TIME_COLUMN_WIDTH}px repeat(${dates.length}, minmax(${dayColumnMinWidth}px, 1fr))`;
  const gridHeight = `${(totalMinutes / 60) * HOUR_ROW_HEIGHT}px`;
  const hourMarks = Array.from(
    { length: Math.max(Math.ceil(totalMinutes / 60) + 1, 2) },
    (_, index) => rangeStart + index * 60,
  );
  const highlightedIds = new Set(highlightedAppointmentIds);
  const groupedAppointments = appointments.reduce<Record<string, Appointment[]>>((groups, appointment) => {
    if (!groups[appointment.data]) {
      groups[appointment.data] = [];
    }

    groups[appointment.data].push(appointment);
    return groups;
  }, {});
  const groupedBlockedSlots = blockedSlots.reduce<Record<string, PositionedBlockedSlot[]>>((groups, slot) => {
    if (!groups[slot.data]) {
      groups[slot.data] = [];
    }

    groups[slot.data].push({
      slot,
      start: timeToMinutes(slot.horarioInicial),
      end: timeToMinutes(slot.horarioFinal),
    });
    return groups;
  }, {});
  const today = getTodayDate();
  const hasAppointments = appointments.length > 0;

  useEffect(() => {
    function updateAvailableHeight() {
      if (typeof window === "undefined") {
        return;
      }

      if (window.innerWidth >= 1280) {
        setMobileCardHeight(null);
        return;
      }

      const rect = cardRef.current?.getBoundingClientRect();

      if (!rect) {
        return;
      }

      const viewportHeight = window.visualViewport?.height ?? window.innerHeight;
      const mobileNavReserve = 96;
      const bottomGap = 12;
      const availableHeight = Math.floor(viewportHeight - rect.top - mobileNavReserve - bottomGap);

      setMobileCardHeight(Math.max(320, availableHeight));
    }

    updateAvailableHeight();
    window.addEventListener("resize", updateAvailableHeight);
    window.visualViewport?.addEventListener("resize", updateAvailableHeight);

    return () => {
      window.removeEventListener("resize", updateAvailableHeight);
      window.visualViewport?.removeEventListener("resize", updateAvailableHeight);
    };
  }, []);

  function handleCreateAppointment(date: string, event: React.MouseEvent<HTMLButtonElement>) {
    if (!onCreateAppointment) {
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();
    const offsetY = event.clientY - rect.top;
    const minutesFromTop = (offsetY / rect.height) * totalMinutes;
    const rawMinutes = rangeStart + minutesFromTop;
    const roundedMinutes = Math.round(rawMinutes / 15) * 15;
    const clampedMinutes = Math.max(rangeStart, Math.min(rangeEnd - 15, roundedMinutes));

    onCreateAppointment({
      date,
      time: formatTime(clampedMinutes),
    });
  }

  return (
    <Card
      className="mb-24 flex min-h-0 flex-col overflow-hidden border-slate-200/80 bg-white/90 p-0 shadow-[0_20px_45px_rgba(15,23,42,0.08)] xl:mb-0 xl:h-[calc(100vh-17.5rem)] xl:min-h-[760px] xl:rounded-[30px] xl:border-slate-200/70 xl:bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,252,0.96))] xl:shadow-[0_28px_60px_rgba(15,23,42,0.10)]"
      ref={cardRef}
      style={mobileCardHeight ? { height: `${mobileCardHeight}px` } : undefined}
    >
      {!hasAppointments && emptyState ? (
        <div className="border-b border-slate-100 bg-slate-50/70 px-4 py-3 text-sm text-slate-500">{emptyState}</div>
      ) : null}

      <div className="min-h-0 flex-1 overflow-auto overscroll-contain xl:[scrollbar-gutter:stable]">
        <div
          className="grid min-w-fit"
          style={{ gridTemplateColumns }}
        >
          <div className="sticky left-0 top-0 z-40 border-b border-r border-slate-200/80 bg-[linear-gradient(180deg,rgba(248,250,252,0.98),rgba(255,255,255,0.96))] px-3 py-4 xl:px-4 xl:py-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Fuso</p>
            <p className="mt-1 text-sm font-semibold text-slate-500">{getTimezoneLabel(timezoneLabel)}</p>
          </div>

          {dates.map((date) => {
            const isSelected = date === selectedDate;
            const isToday = date === today;

            return (
              <button
                className={cn(
                  "sticky top-0 z-30 flex min-w-0 flex-col items-center justify-center gap-1 border-b border-r border-slate-200/80 px-3 py-3 text-center transition last:border-r-0 xl:px-4 xl:py-4",
                  isSelected
                    ? "bg-[linear-gradient(180deg,rgba(239,246,255,0.98),rgba(255,255,255,0.96))]"
                    : "bg-[linear-gradient(180deg,rgba(248,250,252,0.98),rgba(255,255,255,0.96))] hover:bg-slate-50/95",
                )}
                key={date}
                onClick={() => onSelectDate?.(date)}
                type="button"
              >
                <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                  {formatDayLabel(date)}
                </span>
                <span
                  className={cn(
                    "inline-flex h-11 w-11 items-center justify-center rounded-full text-[1.45rem] font-semibold tracking-[-0.04em]",
                    "xl:h-12 xl:w-12 xl:text-[1.6rem]",
                    isToday
                      ? "bg-brand-600 text-white shadow-[0_10px_24px_rgba(29,140,248,0.28)]"
                      : isSelected
                        ? "bg-brand-100 text-brand-700"
                        : "text-slate-700",
                  )}
                >
                  {formatDayNumber(date)}
                </span>
              </button>
            );
          })}

          <div
            className="sticky left-0 z-40 border-r border-slate-200/80 bg-slate-50/95 shadow-[8px_0_18px_rgba(248,250,252,0.95)] xl:bg-slate-50/85"
            style={{ height: gridHeight }}
          >
            {hourMarks.slice(0, -1).map((minute) => {
              const top = ((minute - rangeStart) / totalMinutes) * 100;
              return (
                <div
                  className="absolute inset-x-0"
                  key={minute}
                  style={{ top: `${top}%`, height: `${(60 / totalMinutes) * 100}%` }}
                >
                  <div className="absolute inset-x-0 top-0 border-t border-slate-200/90" />
                  <div className="px-2 pt-1 text-right text-xs font-medium text-slate-400 xl:px-3 xl:text-[12px]">
                    {formatHour(minute)}
                  </div>
                </div>
              );
            })}
          </div>

          {dates.map((date) => {
            const positionedAppointments = layoutOverlappingAppointments(groupedAppointments[date] ?? []);
            const dayBlockedSlots = groupedBlockedSlots[date] ?? [];
            const isToday = date === today;
            const nowMinutes = (() => {
              if (!isToday) {
                return null;
              }

              const now = new Date();
              return now.getHours() * 60 + now.getMinutes();
            })();
            const showNowLine =
              nowMinutes !== null && nowMinutes >= rangeStart && nowMinutes <= rangeEnd;

            return (
              <div
                className={cn(
                  "relative border-r border-slate-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,252,0.92))] last:border-r-0",
                  date === selectedDate && "bg-[linear-gradient(180deg,rgba(239,246,255,0.86),rgba(255,255,255,0.98))]",
                  "xl:bg-[linear-gradient(180deg,rgba(255,255,255,0.99),rgba(248,250,252,0.94))]",
                )}
                key={date}
                style={{ height: gridHeight }}
              >
                {onCreateAppointment ? (
                  <button
                    aria-label={`Novo agendamento em ${date}`}
                    className="absolute inset-0 z-0 cursor-copy transition hover:bg-brand-50/18"
                    onClick={(event) => handleCreateAppointment(date, event)}
                    type="button"
                  />
                ) : null}

                {hourMarks.slice(0, -1).map((minute) => {
                  const top = ((minute - rangeStart) / totalMinutes) * 100;
                  const halfTop = (((minute + 30) - rangeStart) / totalMinutes) * 100;

                  return (
                    <div className="pointer-events-none absolute inset-x-0" key={minute} style={{ top: `${top}%` }}>
                      <div className="border-t border-slate-200/90" />
                      {minute + 30 < rangeEnd ? (
                        <div
                          className="absolute inset-x-0 border-t border-dashed border-slate-100"
                          style={{ top: `${halfTop - top}%` }}
                        />
                      ) : null}
                    </div>
                  );
                })}

                {dayBlockedSlots.map(({ slot, start, end }) => {
                  const position = buildPosition(start, end, rangeStart, totalMinutes);

                  return (
                    <div
                      className="pointer-events-none absolute inset-x-1 z-10 overflow-hidden rounded-[18px] border border-amber-200/80 bg-[repeating-linear-gradient(-45deg,rgba(251,191,36,0.10),rgba(251,191,36,0.10)_12px,rgba(251,191,36,0.18)_12px,rgba(251,191,36,0.18)_24px)]"
                      key={slot.id}
                      style={{ top: `${position.top}%`, height: `${position.height}%` }}
                    >
                      <div className="px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-amber-700">
                        {slot.motivo || "Horario bloqueado"}
                      </div>
                    </div>
                  );
                })}

                {showNowLine ? (
                  <div
                    className="pointer-events-none absolute inset-x-0 z-30"
                    style={{ top: `${((nowMinutes - rangeStart) / totalMinutes) * 100}%` }}
                  >
                    <div className="relative border-t-2 border-rose-400">
                      <span className="absolute -left-1 -top-[5px] h-2.5 w-2.5 rounded-full bg-rose-500 shadow-[0_0_0_3px_rgba(255,255,255,0.95)]" />
                    </div>
                  </div>
                ) : null}

                {positionedAppointments.map(({ appointment, lane, laneCount }) => (
                  <AppointmentBlock
                    appointment={appointment}
                    isHighlighted={highlightedIds.has(appointment.id)}
                    key={appointment.id}
                    lane={lane}
                    laneCount={laneCount}
                    onOpen={onOpenAppointment}
                    position={buildPosition(
                      timeToMinutes(appointment.horarioInicial),
                      timeToMinutes(appointment.horarioFinal),
                      rangeStart,
                      totalMinutes,
                    )}
                  />
                ))}
              </div>
            );
          })}
        </div>
      </div>

      <div className="border-t border-slate-200/80 bg-slate-50/70 px-4 py-3 xl:flex xl:items-center xl:justify-between xl:px-6">
        <p className="text-sm text-slate-500">
          {dates.length === 1 ? formatShortDate(dates[0]) : "Arraste a leitura pela grade para localizar horarios livres com mais rapidez."}
        </p>
        <p className="hidden text-xs font-medium uppercase tracking-[0.18em] text-slate-400 xl:block">
          Grade visual para leitura rapida de disponibilidade
        </p>
      </div>
    </Card>
  );
}
