import type {
  Appointment,
  AppointmentDeleteScope,
  AppointmentPaymentStatus,
} from "@/services/appointmentService";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getAppointmentServiceLabel } from "@/utils/appointment";
import { formatDateBR } from "@/utils/date";

type AppointmentDetailProps = {
  appointment: Appointment;
  isDeleting?: boolean;
  isUpdatingPaymentStatus?: boolean;
  onDelete: (scope: AppointmentDeleteScope) => Promise<void>;
  onPaymentStatusChange: (paymentStatus: AppointmentPaymentStatus) => Promise<void>;
};

export function AppointmentDetail({
  appointment,
  isDeleting = false,
  isUpdatingPaymentStatus = false,
  onDelete,
  onPaymentStatusChange,
}: AppointmentDetailProps) {
  const isRecurring = Boolean(appointment.recurrenceSeriesId && appointment.recurrenceType !== "none");

  async function handleDelete() {
    if (isRecurring) {
      const deleteSeries = window.confirm(
        "Este agendamento faz parte de uma repeticao. Clique em OK para excluir toda a serie ou Cancelar para escolher apenas este registro.",
      );

      if (deleteSeries) {
        await onDelete("series");
        return;
      }

      const deleteOnlyThis = window.confirm("Excluir apenas este agendamento?");

      if (!deleteOnlyThis) {
        return;
      }

      await onDelete("single");
      return;
    }

    const confirmed = window.confirm("Excluir este agendamento?");

    if (!confirmed) {
      return;
    }

    await onDelete("single");
  }

  return (
    <Card>
      <p className="text-xs uppercase tracking-[0.24em] text-brand-600">Detalhes</p>
      <h2 className="mt-2 text-xl font-semibold text-ink">{appointment.clienteNome}</h2>
      <p className="mt-2 text-sm text-slate-500">{getAppointmentServiceLabel(appointment)}</p>
      {appointment.profissionalNome ? (
        <p className="mt-1 text-sm text-slate-500">Profissional: {appointment.profissionalNome}</p>
      ) : null}
      <p className="mt-1 text-sm text-slate-500">
        {formatDateBR(appointment.data)} - {appointment.horarioInicial} - {appointment.horarioFinal}
      </p>
      {isRecurring ? (
        <p className="mt-1 text-sm text-slate-500">
          Recorrencia:{" "}
          {appointment.recurrenceType === "weekly"
            ? "Semanal"
            : appointment.recurrenceType === "biweekly"
              ? "Quinzenal"
              : "Mensal"}
        </p>
      ) : null}

      <div className="mt-4 space-y-2 rounded-2xl border border-slate-100 bg-slate-50/80 px-4 py-4">
        <p className="text-sm font-semibold text-ink">Situacao atual</p>
        <p className="text-sm text-slate-600">
          Pagamento: <strong className="text-ink">{appointment.paymentStatus === "pago" ? "Pago" : "Pendente"}</strong>
        </p>
        <p className="text-sm text-slate-600">
          Atendimento: <strong className="text-ink">{appointment.status}</strong>
        </p>
      </div>

      <Button
        className="mt-4 w-full"
        disabled={isUpdatingPaymentStatus || appointment.paymentStatus === "pago"}
        onClick={() => void onPaymentStatusChange("pago")}
        type="button"
      >
        {appointment.paymentStatus === "pago"
          ? "Pagamento ja realizado"
          : isUpdatingPaymentStatus
            ? "Registrando pagamento..."
            : "Pagamento realizado"}
      </Button>

      <Button
        className="mt-4 w-full"
        disabled={isDeleting}
        onClick={() => void handleDelete()}
        type="button"
        variant="danger"
      >
        {isDeleting ? "Excluindo..." : "Excluir agendamento"}
      </Button>
    </Card>
  );
}
