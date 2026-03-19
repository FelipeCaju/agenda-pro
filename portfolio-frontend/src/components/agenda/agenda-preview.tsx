import { Card } from "@/components/ui/card";
import type { Appointment } from "@/services/appointmentService";
import { formatAgendaDate, formatTimeRange } from "@/utils/agenda";

function getPaymentLabel(item: Appointment) {
  if (item.status === "cancelado") {
    return "Cancelado";
  }

  return item.paymentStatus === "pago" ? "Pago" : "Pendente";
}

export function AgendaPreview({ items }: { items: Appointment[] }) {
  if (!items.length) {
    return (
      <Card>
        <p className="text-sm text-slate-500">Nenhum agendamento para mostrar por enquanto.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <Card key={item.id}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="font-semibold text-ink">{item.clienteNome}</h3>
              <p className="mt-1 text-sm text-slate-500">{item.servicoNome}</p>
            </div>
            <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-600">
              {getPaymentLabel(item)}
            </span>
          </div>
          <p className="mt-3 text-sm text-slate-600">
            {formatAgendaDate(item.data)} - {formatTimeRange(item)}
          </p>
        </Card>
      ))}
    </div>
  );
}
