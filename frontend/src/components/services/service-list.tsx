import type { BusinessService } from "@/services/serviceService";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PlusIcon, ScissorsIcon } from "@/components/ui/icons";

type ServiceListProps = {
  items: BusinessService[];
  onCreate: () => void;
  onEdit: (service: BusinessService) => void;
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function ServiceList({ items, onCreate, onEdit }: ServiceListProps) {
  if (!items.length) {
    return (
      <Card className="flex min-h-[55vh] flex-col items-center justify-center rounded-[24px] bg-transparent px-6 text-center shadow-none">
        <div className="flex h-16 w-16 items-center justify-center rounded-[18px] bg-slate-100 text-slate-400">
          <ScissorsIcon className="h-8 w-8" />
        </div>
        <h3 className="mt-6 text-[1.75rem] font-semibold tracking-[-0.03em] text-ink">Nenhum serviço</h3>
        <p className="mt-2 text-base text-slate-500">Cadastre seu primeiro serviço</p>
        <Button className="mt-5 gap-2 rounded-[16px] px-5" onClick={onCreate} type="button">
          <PlusIcon className="h-4 w-4" />
          Cadastrar
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((service) => (
        <button className="block w-full text-left" key={service.id} onClick={() => onEdit(service)} type="button">
          <Card className="rounded-[20px] border border-slate-200/70 bg-white px-4 py-4 shadow-[0_4px_16px_rgba(15,23,36,0.06)]">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-3">
                  <span
                    aria-hidden="true"
                    className="h-3.5 w-3.5 rounded-full"
                    style={{ backgroundColor: service.cor || "#1d8cf8" }}
                  />
                  <h3 className="truncate text-[1.05rem] font-semibold tracking-[-0.02em] text-ink">
                    {service.nome}
                  </h3>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
                  <span>{service.duracaoMinutos} min</span>
                  <span>{formatCurrency(service.valorPadrao)}</span>
                </div>
                {service.descricao ? <p className="mt-2 text-sm text-slate-500">{service.descricao}</p> : null}
              </div>

              {!service.ativo ? (
                <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-500">
                  Inativo
                </span>
              ) : null}
            </div>
          </Card>
        </button>
      ))}
    </div>
  );
}
