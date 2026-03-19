import type { Appointment } from "@/services/appointmentService";
import {
  formatAgendaDate,
  getMonthGrid,
  groupAppointmentsByDate,
} from "@/utils/agenda";
import { Card } from "@/components/ui/card";

type MonthViewProps = {
  appointments: Appointment[];
  selectedDate: string;
  onOpenDate: (date: string) => void;
};

export function MonthView({ appointments, selectedDate, onOpenDate }: MonthViewProps) {
  const grouped = groupAppointmentsByDate(appointments);
  const cells = getMonthGrid(selectedDate);
  const currentMonth = selectedDate.slice(0, 7);

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
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
  );
}
