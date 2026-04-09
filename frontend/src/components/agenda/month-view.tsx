import type { Appointment } from "@/services/appointmentService";
import {
  formatAgendaDate,
  getMonthGrid,
  groupAppointmentsByDate,
} from "@/utils/agenda";
import { Card } from "@/components/ui/card";
import { cn } from "@/utils/cn";

type MonthViewProps = {
  appointments: Appointment[];
  selectedDate: string;
  onOpenDate: (date: string) => void;
};

export function MonthView({ appointments, selectedDate, onOpenDate }: MonthViewProps) {
  const grouped = groupAppointmentsByDate(appointments);
  const cells = getMonthGrid(selectedDate);
  const currentMonth = selectedDate.slice(0, 7);
  const weekDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"];

  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:hidden">
        {cells.map((date) => {
          const isCurrentMonth = date.startsWith(currentMonth);
          const items = grouped[date] ?? [];

          return (
            <button key={date} onClick={() => onOpenDate(date)} type="button">
              <Card
                className={
                  !isCurrentMonth
                    ? "bg-white/[0.7] opacity-60"
                    : date === selectedDate
                      ? "border-brand-100 bg-white"
                      : "bg-white/[0.86]"
                }
              >
                <p className="text-sm font-semibold text-ink">{formatAgendaDate(date)}</p>
                <p className="mt-3 text-2xl font-bold text-brand-600">{items.length}</p>
                <p className="text-xs text-slate-500">agendamento(s)</p>
              </Card>
            </button>
          );
        })}
      </div>

      <Card className="hidden overflow-hidden border-slate-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,252,0.96))] p-0 shadow-[0_24px_48px_rgba(15,23,42,0.08)] xl:block">
        <div className="grid grid-cols-7 border-b border-slate-200/80 bg-slate-50/85">
          {weekDays.map((weekDay) => (
            <div
              className="border-r border-slate-200/80 px-4 py-4 text-center text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400 last:border-r-0"
              key={weekDay}
            >
              {weekDay}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {cells.map((date) => {
            const isCurrentMonth = date.startsWith(currentMonth);
            const items = grouped[date] ?? [];
            const isSelected = date === selectedDate;
            const previewItems = items.slice(0, 3);

            return (
              <button
                className={cn(
                  "min-h-[180px] border-r border-b border-slate-200/80 px-4 py-4 text-left transition last:border-r-0 hover:bg-slate-50/70",
                  !isCurrentMonth && "bg-slate-50/45 text-slate-400",
                  isSelected && "bg-brand-50/55",
                )}
                key={date}
                onClick={() => onOpenDate(date)}
                type="button"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className={cn("text-sm font-semibold text-ink", !isCurrentMonth && "text-slate-400")}>
                      {formatAgendaDate(date)}
                    </p>
                    <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-400">
                      {items.length} agendamento(s)
                    </p>
                  </div>
                  <span
                    className={cn(
                      "inline-flex min-h-9 min-w-9 items-center justify-center rounded-full px-2 text-sm font-semibold",
                      isSelected ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-600",
                    )}
                  >
                    {date.slice(-2)}
                  </span>
                </div>

                <div className="mt-5 space-y-2">
                  {previewItems.length ? (
                    previewItems.map((appointment) => (
                      <div
                        className="rounded-[16px] border border-slate-200/80 bg-white/90 px-3 py-2 shadow-[0_8px_18px_rgba(15,23,42,0.05)]"
                        key={appointment.id}
                      >
                        <p className="truncate text-sm font-semibold text-ink">{appointment.servicoNome}</p>
                        <p className="mt-1 truncate text-xs text-slate-500">
                          {appointment.horarioInicial} • {appointment.clienteNome}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="pt-2 text-sm text-slate-400">Dia livre para novos encaixes.</p>
                  )}

                  {items.length > previewItems.length ? (
                    <p className="pt-1 text-xs font-semibold uppercase tracking-[0.16em] text-brand-700">
                      +{items.length - previewItems.length} restante(s)
                    </p>
                  ) : null}
                </div>
              </button>
            );
          })}
        </div>
      </Card>
    </>
  );
}
