import { useState } from "react";
import type {
  Appointment,
  AppointmentDeleteScope,
  AppointmentPaymentStatus,
} from "@/services/appointmentService";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
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
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  async function handleDelete() {
    setDeleteDialogOpen(true);
  }

  async function handleDeleteScope(scope: AppointmentDeleteScope) {
    await onDelete(scope);
    setDeleteDialogOpen(false);
  }

  return (
    <>
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

        {appointment.items.length ? (
          <div className="mt-4 space-y-2 rounded-2xl border border-slate-100 bg-white px-4 py-4">
            <p className="text-sm font-semibold text-ink">Servicos do atendimento</p>
            {appointment.items.map((item) => (
              <div className="flex items-center justify-between gap-3 text-sm text-slate-600" key={item.id}>
                <div>
                  <p className="font-medium text-ink">{item.servicoNome}</p>
                  <p>{item.duracaoMinutos} min</p>
                </div>
                <p className="font-semibold text-ink">
                  {new Intl.NumberFormat("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  }).format(item.valorTotal)}
                </p>
              </div>
            ))}
          </div>
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

      <ConfirmationDialog
        cancelAction={{
          label: "Cancelar",
          onClick: () => setDeleteDialogOpen(false),
          variant: "secondary",
          disabled: isDeleting,
        }}
        confirmAction={{
          label: isRecurring ? "Excluir toda a serie" : "Excluir agendamento",
          onClick: () => void handleDeleteScope(isRecurring ? "series" : "single"),
          variant: "danger",
          disabled: isDeleting,
        }}
        description={
          isRecurring
            ? "Este atendimento faz parte de uma repeticao. Voce pode remover toda a serie ou excluir apenas este horario sem afetar os demais."
            : "Essa exclusao remove o atendimento da agenda e nao podera ser desfeita."
        }
        open={deleteDialogOpen}
        secondaryAction={
          isRecurring
            ? {
                label: "Excluir so este",
                onClick: () => void handleDeleteScope("single"),
                variant: "ghost",
                disabled: isDeleting,
              }
            : undefined
        }
        title={isRecurring ? "Excluir serie de agendamentos?" : "Excluir agendamento?"}
      />
    </>
  );
}
