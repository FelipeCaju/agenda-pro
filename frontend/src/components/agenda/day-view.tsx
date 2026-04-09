import { TimeGrid } from "@/components/agenda/time-grid";
import type { BlockedSlot } from "@/services/blockedSlotService";
import type { Appointment } from "@/services/appointmentService";

type DayViewProps = {
  appointments: Appointment[];
  blockedSlots?: BlockedSlot[];
  selectedDate: string;
  startHour: string;
  endHour: string;
  timezoneLabel: string;
  onOpenAppointment: (appointment: Appointment) => void;
  onCreateAppointment?: (payload: { date: string; time: string }) => void;
  highlightedAppointmentIds?: string[];
};

export function DayView({
  appointments,
  blockedSlots = [],
  selectedDate,
  startHour,
  endHour,
  timezoneLabel,
  onOpenAppointment,
  onCreateAppointment,
  highlightedAppointmentIds = [],
}: DayViewProps) {
  return (
    <TimeGrid
      appointments={appointments}
      blockedSlots={blockedSlots}
      dates={[selectedDate]}
      emptyState="Nenhum agendamento neste dia. A grade continua visivel para facilitar novos encaixes."
      endHour={endHour}
      highlightedAppointmentIds={highlightedAppointmentIds}
      onCreateAppointment={onCreateAppointment}
      onOpenAppointment={onOpenAppointment}
      selectedDate={selectedDate}
      startHour={startHour}
      timezoneLabel={timezoneLabel}
    />
  );
}
