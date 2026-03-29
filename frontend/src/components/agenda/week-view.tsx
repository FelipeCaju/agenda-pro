import type { Appointment } from "@/services/appointmentService";
import { formatAgendaDate, getWeekDates, groupAppointmentsByDate } from "@/utils/agenda";
import { AppointmentCard } from "@/components/agenda/appointment-card";
import { Card } from "@/components/ui/card";

type WeekViewProps = {
  appointments: Appointment[];
  selectedDate: string;
  onOpenAppointment: (appointment: Appointment) => void;
  onSelectDate: (date: string) => void;
  highlightedAppointmentIds?: string[];
};

export function WeekView({
  appointments,
  selectedDate,
  onOpenAppointment,
  onSelectDate,
  highlightedAppointmentIds = [],
}: WeekViewProps) {
  const dates = getWeekDates(selectedDate);
  const grouped = groupAppointmentsByDate(appointments);
  const highlightedIds = new Set(highlightedAppointmentIds);

  return (
    <div className="space-y-3">
      {dates.map((date) => (
        <Card className={date === selectedDate ? "border-brand-100 bg-white" : "bg-white/[0.86]"} key={date}>
          <button
            className="w-full text-left"
            onClick={() => onSelectDate(date)}
            type="button"
          >
            <p className="text-sm font-semibold text-ink">{formatAgendaDate(date)}</p>
          </button>
          <div className="mt-3 space-y-2">
            {(grouped[date] ?? []).length ? (
              (grouped[date] ?? []).map((appointment) => (
                <AppointmentCard
                  appointment={appointment}
                  isHighlighted={highlightedIds.has(appointment.id)}
                  key={appointment.id}
                  onOpen={onOpenAppointment}
                />
              ))
            ) : (
              <p className="text-sm text-slate-500">Sem agendamentos.</p>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
}
