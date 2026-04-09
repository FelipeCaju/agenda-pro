import type {
  Appointment,
  AppointmentPaymentStatus,
} from "@/services/appointmentService";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatDateBR } from "@/utils/date";

type AppointmentDetailProps = {
  appointment: Appointment;
  isDeleting?: boolean;
  isUpdatingPaymentStatus?: boolean;
  onDelete: () => Promise<void>;
  onPaymentStatusChange: (paymentStatus: AppointmentPaymentStatus) => Promise<void>;
};

export function AppointmentDetail({
  appointment,
  isDeleting = false,
  isUpdatingPaymentStatus = false,
  onDelete,
  onPaymentStatusChange,
}: AppointmentDetailProps) {
  return (
    <Card>
      <p className="text-xs uppercase tracking-[0.24em] text-brand-600">Detalhes</p>
      <h2 className="mt-2 text-xl font-semibold text-ink">{appointment.clienteNome}</h2>
      <p className="mt-2 text-sm text-slate-500">{appointment.servicoNome}</p>
      {appointment.profissionalNome ? (
        <p className="mt-1 text-sm text-slate-500">Profissional: {appointment.profissionalNome}</p>
      ) : null}
      <p className="mt-1 text-sm text-slate-500">
        {formatDateBR(appointment.data)} - {appointment.horarioInicial} - {appointment.horarioFinal}
      </p>

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
        onClick={() => void onDelete()}
        type="button"
        variant="danger"
      >
        {isDeleting ? "Excluindo..." : "Excluir agendamento"}
      </Button>
    </Card>
  );
}
