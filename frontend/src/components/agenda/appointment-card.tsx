import type { Appointment } from "@/services/appointmentService";
import { formatTimeRange } from "@/utils/agenda";
import { getAppointmentServiceLabel } from "@/utils/appointment";
import { Card } from "@/components/ui/card";

type AppointmentCardProps = {
  appointment: Appointment;
  onOpen: (appointment: Appointment) => void;
  isHighlighted?: boolean;
};

function PersonIcon() {
  return (
    <svg
      className="h-4 w-4 text-slate-400"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
    >
      <path d="M12 12a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" />
      <path d="M5 19a7 7 0 0 1 14 0" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg
      className="h-4 w-4 text-slate-400"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
    >
      <circle cx="12" cy="12" r="8" />
      <path d="M12 8v4l2.8 1.8" />
    </svg>
  );
}

function getStatusPresentation(appointment: Appointment) {
  if (appointment.status === "cancelado") {
    return {
      label: "Cancelado",
      className: "bg-rose-50 text-rose-700",
      dotClassName: "bg-rose-400",
    };
  }

  if (appointment.paymentStatus === "pago") {
    return {
      label: "Pago",
      className: "bg-emerald-50 text-emerald-700",
      dotClassName: "bg-emerald-400",
    };
  }

  return {
    label: "Pendente",
    className: "bg-brand-50 text-brand-700",
    dotClassName: "bg-brand-500",
  };
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function AppointmentCard({
  appointment,
  onOpen,
  isHighlighted = false,
}: AppointmentCardProps) {
  const status = getStatusPresentation(appointment);

  return (
    <button className="w-full text-left" onClick={() => onOpen(appointment)} type="button">
      <Card
        className={`relative overflow-hidden rounded-[22px] border bg-white p-0 shadow-soft ${
          isHighlighted ? "border-brand-200 ring-2 ring-brand-100" : "border-slate-200/70"
        }`}
      >
        <span
          aria-hidden="true"
          className="absolute inset-y-4 left-0 w-1 rounded-full"
          style={{ backgroundColor: appointment.servicoCor || "#1d8cf8" }}
        />

        <div className="space-y-3 px-5 py-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="truncate text-[1.05rem] font-semibold tracking-[-0.02em] text-ink">
                {getAppointmentServiceLabel(appointment)}
              </h3>
            </div>

            <span
              className={`inline-flex shrink-0 items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ${status.className}`}
            >
              <span className={`h-2 w-2 rounded-full ${status.dotClassName}`} />
              {status.label}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-500">
            <span className="inline-flex items-center gap-1.5">
              <PersonIcon />
              {appointment.clienteNome}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <ClockIcon />
              {formatTimeRange(appointment)}
            </span>
          </div>

          <p className="text-base font-semibold text-ink">{formatCurrency(appointment.valor)}</p>
        </div>
      </Card>
    </button>
  );
}
