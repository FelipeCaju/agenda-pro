import type { Appointment } from "@/services/appointmentService";

export function getAppointmentServiceLabel(appointment: Pick<Appointment, "servicoNome" | "lembreteConfirmado" | "confirmacaoCliente">) {
  const isConfirmed =
    appointment.lembreteConfirmado || appointment.confirmacaoCliente === "confirmado";

  return isConfirmed ? `${appointment.servicoNome} - Confirmado` : appointment.servicoNome;
}
