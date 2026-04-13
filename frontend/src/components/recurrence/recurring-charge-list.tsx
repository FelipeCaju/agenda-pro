import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { RecurringCharge } from "@/services/recurrenceService";

type RecurringChargeListProps = {
  items: RecurringCharge[];
  onMarkPaid: (charge: RecurringCharge) => void;
  onCancel: (charge: RecurringCharge) => void;
  onResendWhatsapp: (charge: RecurringCharge) => void;
  onOpenProfile: (charge: RecurringCharge) => void;
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function getStatusStyle(status: RecurringCharge["status"]) {
  if (status === "pago") return "bg-emerald-50 text-emerald-700";
  if (status === "vencido") return "bg-amber-50 text-amber-700";
  if (status === "cancelado") return "bg-slate-100 text-slate-500";
  return "bg-brand-50 text-brand-700";
}

function getStatusLabel(status: RecurringCharge["status"]) {
  if (status === "pago") return "Pago";
  if (status === "vencido") return "Vencido";
  if (status === "cancelado") return "Cancelado";
  return "Pendente";
}

export function RecurringChargeList({
  items,
  onMarkPaid,
  onCancel,
  onResendWhatsapp,
  onOpenProfile,
}: RecurringChargeListProps) {
  if (!items.length) {
    return (
      <Card className="bg-white">
        <h3 className="font-semibold text-ink">Nenhuma cobranca encontrada</h3>
        <p className="mt-2 text-sm text-slate-500">
          Ajuste os filtros ou execute a rotina diaria para gerar cobrancas.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((charge) => (
        <Card className="rounded-[20px] border border-slate-200/70 bg-white px-4 py-4" key={charge.id}>
          <div className="flex flex-col gap-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-[1.05rem] font-semibold text-ink">{charge.clientName}</h3>
                  <span className={`rounded-full px-2 py-1 text-[11px] font-medium ${getStatusStyle(charge.status)}`}>
                    {getStatusLabel(charge.status)}
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500">
                  <span>{charge.serviceName}</span>
                  <span>{formatCurrency(charge.valor)}</span>
                  <span>Vencimento {charge.dataVencimento}</span>
                </div>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500">
                  <span>Competencia {charge.referenciaCompetencia}</span>
                  <span>{charge.whatsappEnviado ? "WhatsApp enviado" : "WhatsApp pendente"}</span>
                  <span>Tentativas {charge.whatsappTentativas}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                disabled={charge.status === "pago" || charge.status === "cancelado"}
                onClick={() => onMarkPaid(charge)}
                type="button"
              >
                Marcar pago
              </Button>
              <Button
                disabled={charge.status === "pago" || charge.status === "cancelado"}
                onClick={() => onCancel(charge)}
                type="button"
                variant="secondary"
              >
                Cancelar
              </Button>
              <Button onClick={() => onResendWhatsapp(charge)} type="button" variant="ghost">
                Reenviar WhatsApp
              </Button>
              <Button onClick={() => onOpenProfile(charge)} type="button" variant="ghost">
                Ver origem
              </Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
