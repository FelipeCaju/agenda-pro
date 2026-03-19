import type { DashboardSummary } from "@/services/dashboardService";
import { Card } from "@/components/ui/card";

type StatusBreakdownProps = {
  items: DashboardSummary["charts"]["statusBreakdown"];
  servicesByVolume: DashboardSummary["charts"]["servicesByVolume"];
};

function getStatusLabel(status: string) {
  if (status === "pendente") return "Pendentes";
  if (status === "confirmado") return "Confirmados";
  if (status === "concluido") return "Concluidos";
  if (status === "cancelado") return "Cancelados";
  return status;
}

export function StatusBreakdown({ items, servicesByVolume }: StatusBreakdownProps) {
  const maxStatus = Math.max(...items.map((item) => item.total), 1);
  const maxServices = Math.max(...servicesByVolume.map((item) => item.total), 1);

  return (
    <Card>
      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Distribuicao</p>
      <h3 className="mt-1 text-lg font-semibold text-ink">Status e servicos</h3>

      <div className="mt-4 space-y-3">
        {items.map((item) => (
          <div key={item.status}>
            <div className="mb-1 flex items-center justify-between gap-3 text-sm">
              <span className="font-medium text-ink">{getStatusLabel(item.status)}</span>
              <span className="text-slate-500">{item.total}</span>
            </div>
            <div className="h-2 rounded-full bg-slate-100">
              <div
                className="h-2 rounded-full bg-brand-500"
                style={{ width: `${(item.total / maxStatus) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 space-y-3">
        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Mais vendidos</p>
        {servicesByVolume.length ? (
          servicesByVolume.map((item) => (
            <div key={item.serviceId}>
              <div className="mb-1 flex items-center justify-between gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: item.cor }}
                  />
                  <span className="font-medium text-ink">{item.nome}</span>
                </div>
                <span className="text-slate-500">{item.total}</span>
              </div>
              <div className="h-2 rounded-full bg-slate-100">
                <div
                  className="h-2 rounded-full"
                  style={{
                    width: `${(item.total / maxServices) * 100}%`,
                    backgroundColor: item.cor,
                  }}
                />
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm text-slate-500">Sem volume de servicos neste periodo.</p>
        )}
      </div>
    </Card>
  );
}
