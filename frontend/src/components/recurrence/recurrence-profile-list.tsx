import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { Client } from "@/services/clientService";
import type { BusinessService } from "@/services/serviceService";
import type { RecurringProfile } from "@/services/recurrenceService";
import { formatDateBr } from "@/utils/date";

type RecurrenceProfileListProps = {
  items: RecurringProfile[];
  clients: Client[];
  services: BusinessService[];
  onCreate: () => void;
  onEdit: (profile: RecurringProfile) => void;
  onViewCharges: (profile: RecurringProfile) => void;
  onToggleActive: (profile: RecurringProfile) => void;
  onDelete: (profile: RecurringProfile) => void;
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function getClientName(clients: Client[], clientId: string) {
  return clients.find((client) => client.id === clientId)?.nome ?? "Cliente";
}

function getServiceName(services: BusinessService[], serviceId: string) {
  return services.find((service) => service.id === serviceId)?.nome ?? "Servico";
}

export function RecurrenceProfileList({
  items,
  clients,
  services,
  onCreate,
  onEdit,
  onViewCharges,
  onToggleActive,
  onDelete,
}: RecurrenceProfileListProps) {
  if (!items.length) {
    return (
      <Card className="bg-white">
        <h3 className="font-semibold text-ink">Nenhuma recorrencia encontrada</h3>
        <p className="mt-2 text-sm text-slate-500">
          Cadastre a primeira recorrencia para gerar cobrancas mensais sem usar a agenda.
        </p>
        <Button className="mt-4" onClick={onCreate} type="button">
          Nova recorrencia
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((profile) => (
        <Card className="rounded-[20px] border border-slate-200/70 bg-white px-4 py-4" key={profile.id}>
          <div className="flex flex-col gap-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-[1.05rem] font-semibold text-ink">
                    {profile.descricao || getServiceName(services, profile.serviceId)}
                  </h3>
                  <span
                    className={`rounded-full px-2 py-1 text-[11px] font-medium ${
                      profile.ativo
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {profile.ativo ? "Ativa" : "Inativa"}
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500">
                  <span>{getClientName(clients, profile.clientId)}</span>
                  <span>{getServiceName(services, profile.serviceId)}</span>
                  <span>{formatCurrency(profile.valor)}</span>
                </div>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500">
                  <span>Inicio {formatDateBr(profile.dataInicio)}</span>
                  <span>Dia do pagamento {profile.diaCobranca}</span>
                  {profile.dataFim ? <span>Fim {formatDateBr(profile.dataFim)}</span> : <span>Sem data final</span>}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button onClick={() => onEdit(profile)} type="button" variant="secondary">
                Editar
              </Button>
              <Button onClick={() => onViewCharges(profile)} type="button" variant="secondary">
                Ver cobrancas
              </Button>
              <Button onClick={() => onToggleActive(profile)} type="button" variant="ghost">
                {profile.ativo ? "Inativar" : "Ativar"}
              </Button>
              <Button onClick={() => onDelete(profile)} type="button" variant="danger">
                Excluir
              </Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
