import { useDeferredValue, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MobilePageHeader } from "@/components/layout/mobile-page-header";
import { ClientList } from "@/components/clients/client-list";
import { Card } from "@/components/ui/card";
import { FloatingActionButton } from "@/components/ui/floating-action-button";
import { SearchIcon } from "@/components/ui/icons";
import { useClientsQuery } from "@/hooks/use-clients-query";

export function ClientsPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const { data = [], error, isLoading, isError } = useClientsQuery(deferredSearch);

  return (
    <section className="space-y-4">
      <MobilePageHeader
        subtitle={`${data.length} cadastrados`}
        title="Clientes"
      />

      <Card className="rounded-[18px] border border-slate-200/70 bg-white px-4 py-3 shadow-[0_4px_16px_rgba(15,23,36,0.05)]">
        <div className="flex items-center gap-3 text-slate-400">
          <SearchIcon className="h-5 w-5" />
          <input
            className="w-full border-0 bg-transparent p-0 text-base text-ink outline-none placeholder:text-slate-400"
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar clientes..."
            value={search}
          />
        </div>
      </Card>

      {isLoading ? (
        <Card className="bg-white">
          <p className="text-sm text-slate-500">Carregando clientes...</p>
        </Card>
      ) : null}

      {isError ? (
        <Card className="app-message-error">
          <p className="text-sm font-medium">{error.message}</p>
        </Card>
      ) : null}

      {!isLoading && !isError ? (
        <ClientList items={data} onEdit={(client) => navigate(`/clientes/${client.id}/editar`)} />
      ) : null}

      <FloatingActionButton label="Novo" onClick={() => navigate("/clientes/novo")} />
    </section>
  );
}
