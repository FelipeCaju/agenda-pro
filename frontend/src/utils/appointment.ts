import type { Appointment, AppointmentItem } from "@/services/appointmentService";

function getPrimaryItem(
  appointment: Pick<Appointment, "items">,
): AppointmentItem | null {
  return appointment.items?.[0] ?? null;
}

export function getAppointmentServiceColor(
  appointment: Pick<Appointment, "items" | "servicoCor" | "servicoNome">,
) {
  const normalized = getPrimaryItem(appointment)?.servicoCor?.trim() || appointment.servicoCor?.trim();
  return normalized || "#1d8cf8";
}

export function getAppointmentServiceLabel(
  appointment: Pick<
    Appointment,
    "items" | "servicoNome" | "status" | "lembreteConfirmado" | "confirmacaoCliente"
  >,
) {
  const primaryItem = getPrimaryItem(appointment);
  const baseLabel = primaryItem?.servicoNome || appointment.servicoNome;
  const extraItems = Math.max((appointment.items?.length ?? 0) - 1, 0);
  const isConfirmed =
    appointment.status === "confirmado" ||
    appointment.lembreteConfirmado ||
    appointment.confirmacaoCliente === "confirmado";

  const summarizedLabel = extraItems > 0 ? `${baseLabel} + ${extraItems} servico${extraItems > 1 ? "s" : ""}` : baseLabel;

  return isConfirmed ? `${summarizedLabel} - Confirmado` : summarizedLabel;
}
