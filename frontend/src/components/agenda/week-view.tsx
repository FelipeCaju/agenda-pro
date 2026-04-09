import type { Appointment } from "@/services/appointmentService";
import type { BlockedSlot } from "@/services/blockedSlotService";
import { getWeekDates } from "@/utils/agenda";
import { TimeGrid } from "@/components/agenda/time-grid";

type WeekViewProps = {
  appointments: Appointment[];
  blockedSlots?: BlockedSlot[];
  selectedDate: string;
  startHour: string;
  endHour: string;
  timezoneLabel: string;
  onOpenAppointment: (appointment: Appointment) => void;
  onCreateAppointment?: (payload: { date: string; time: string }) => void;
  onSelectDate: (date: string) => void;
  highlightedAppointmentIds?: string[];
};

export function WeekView({
  appointments,
  blockedSlots = [],
  selectedDate,
  startHour,
  endHour,
  timezoneLabel,
  onOpenAppointment,
  onCreateAppointment,
  onSelectDate,
  highlightedAppointmentIds = [],
}: WeekViewProps) {
  const dates = getWeekDates(selectedDate);

  return (
    <TimeGrid
      appointments={appointments}
      blockedSlots={blockedSlots}
      dates={dates}
      emptyState="Semana sem atendimentos ainda. A grade horaria completa fica visivel para apoiar o planejamento."
      endHour={endHour}
      highlightedAppointmentIds={highlightedAppointmentIds}
      onCreateAppointment={onCreateAppointment}
      onOpenAppointment={onOpenAppointment}
      onSelectDate={onSelectDate}
      selectedDate={selectedDate}
      startHour={startHour}
      timezoneLabel={timezoneLabel}
    />
  );
}
