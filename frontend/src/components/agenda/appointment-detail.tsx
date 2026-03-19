import type {
  Appointment,
  AppointmentPaymentStatus,
  AppointmentStatus,
} from "@/services/appointmentService";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatDateBR } from "@/utils/date";

type AppointmentDetailProps = {
  appointment: Appointment;
  isDeleting?: boolean;
  isUpdatingPaymentStatus?: boolean;
  isUpdatingStatus?: boolean;
  onDelete: () => Promise<void>;
  onPaymentStatusChange: (paymentStatus: AppointmentPaymentStatus) => Promise<void>;
  onStatusChange: (status: AppointmentStatus) => Promise<void>;
};

export function AppointmentDetail({
  appointment,
  isDeleting = false,
  isUpdatingPaymentStatus = false,
  isUpdatingStatus = false,
  onDelete,
  onPaymentStatusChange,
  onStatusChange,
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

      <div className="mt-4">
        <p className="text-sm font-semibold text-ink">Status de pagamento</p>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {(["pendente", "pago"] as AppointmentPaymentStatus[]).map((paymentStatus) => (
            <Button
              className="w-full"
              disabled={isUpdatingPaymentStatus}
              key={paymentStatus}
              onClick={() => void onPaymentStatusChange(paymentStatus)}
              type="button"
              variant={appointment.paymentStatus === paymentStatus ? "primary" : "secondary"}
            >
              {paymentStatus === "pago" ? "Pago" : "Pendente"}
            </Button>
          ))}
        </div>
      </div>

      <p className="mt-4 text-sm font-semibold text-ink">Status do atendimento</p>
      <div className="mt-4 grid grid-cols-2 gap-2">
        {(["pendente", "confirmado", "concluido", "cancelado"] as AppointmentStatus[]).map(
          (status) => (
            <Button
              className="w-full"
              disabled={isUpdatingStatus}
              key={status}
              onClick={() => void onStatusChange(status)}
              type="button"
              variant={appointment.status === status ? "primary" : "secondary"}
            >
              {status}
            </Button>
          ),
        )}
      </div>

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
