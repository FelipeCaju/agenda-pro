import type { Appointment } from "@/services/appointmentService";

export function getAppointmentServiceColor(appointment: Pick<Appointment, "servicoCor">) {
  const normalized = appointment.servicoCor?.trim();
  return normalized || "#1d8cf8";
}

export function getAppointmentServiceLabel(appointment: Pick<Appointment, "servicoNome" | "lembreteConfirmado" | "confirmacaoCliente">) {
  const isConfirmed =
    appointment.lembreteConfirmado || appointment.confirmacaoCliente === "confirmado";

  return isConfirmed ? `${appointment.servicoNome} - Confirmado` : appointment.servicoNome;
}
