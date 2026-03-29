import { AppointmentCard } from "@/components/agenda/appointment-card";
import { Card } from "@/components/ui/card";
import type { Appointment } from "@/services/appointmentService";
import { formatAgendaSectionDate, getTimeLabel } from "@/utils/agenda";

type DayViewProps = {
  appointments: Appointment[];
  selectedDate: string;
  onOpenAppointment: (appointment: Appointment) => void;
  highlightedAppointmentIds?: string[];
};

export function DayView({
  appointments,
  selectedDate,
  onOpenAppointment,
  highlightedAppointmentIds = [],
}: DayViewProps) {
  const highlightedIds = new Set(highlightedAppointmentIds);

  if (!appointments.length) {
    return (
      <Card className="bg-white/[0.82]">
        <p className="text-sm text-slate-500">Nenhum agendamento neste dia.</p>
      </Card>
    );
  }

  const lastTime = appointments[appointments.length - 1]?.horarioFinal ?? "16:00";

  return (
    <div className="space-y-3">
      <div className="border-t border-slate-200/80 pt-3">
        <p className="text-lg font-semibold tracking-[-0.02em] text-slate-600">
          {formatAgendaSectionDate(selectedDate)}
        </p>
      </div>

      <div className="space-y-4">
        {appointments.map((appointment) => (
          <div className="grid grid-cols-[54px_minmax(0,1fr)] items-start gap-3" key={appointment.id}>
            <div className="pt-3 text-sm font-medium text-slate-400">
              {getTimeLabel(appointment.horarioInicial)}
            </div>
            <AppointmentCard
              appointment={appointment}
              isHighlighted={highlightedIds.has(appointment.id)}
              onOpen={onOpenAppointment}
            />
          </div>
        ))}

        <div className="grid grid-cols-[54px_minmax(0,1fr)] items-center gap-3">
          <div className="text-sm font-medium text-brand-600">{lastTime.slice(0, 5)}</div>
          <div className="relative h-4">
            <span className="absolute left-0 top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full bg-brand-500" />
            <span className="absolute left-2.5 right-0 top-1/2 h-px -translate-y-1/2 bg-brand-300" />
          </div>
        </div>
      </div>
    </div>
  );
}
