import type { Client } from "@/services/clientService";
import { Card } from "@/components/ui/card";
import { MailIcon, PhoneIcon } from "@/components/ui/icons";

type ClientListProps = {
  items: Client[];
  onEdit: (client: Client) => void;
};

function getInitial(name: string) {
  return name.trim().charAt(0).toUpperCase() || "?";
}

export function ClientList({ items, onEdit }: ClientListProps) {
  if (!items.length) {
    return (
      <Card className="bg-white">
        <h3 className="font-semibold text-ink">Nenhum cliente encontrado</h3>
        <p className="mt-2 text-sm text-slate-500">
          Ajuste a busca ou cadastre um novo cliente para comecar.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((client) => (
        <button className="block w-full text-left" key={client.id} onClick={() => onEdit(client)} type="button">
          <Card className="rounded-[20px] border border-slate-200/70 bg-white px-4 py-4 shadow-[0_4px_16px_rgba(15,23,36,0.06)]">
            <div className="flex items-center gap-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-50 text-base font-semibold text-brand-600">
                {getInitial(client.nome || "")}
              </span>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="truncate text-[1.08rem] font-semibold tracking-[-0.02em] text-ink">
                    {client.nome || "Sem nome"}
                  </h3>
                  {!client.ativo ? (
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">
                      Inativo
                    </span>
                  ) : null}
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
                  <span className="inline-flex items-center gap-1.5">
                    <PhoneIcon className="h-4 w-4" />
                    {client.telefone || "Sem telefone"}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <MailIcon className="h-4 w-4" />
                    <span className="truncate">{client.email || "Sem email"}</span>
                  </span>
                </div>
              </div>
            </div>
          </Card>
        </button>
      ))}
    </div>
  );
}
