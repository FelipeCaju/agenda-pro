import { useDeferredValue, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { MobilePageHeader } from "@/components/layout/mobile-page-header";
import { ClientList, type ClientPlanMembership } from "@/components/clients/client-list";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FloatingActionButton } from "@/components/ui/floating-action-button";
import { SearchIcon } from "@/components/ui/icons";
import { useClientsQuery } from "@/hooks/use-clients-query";
import { apiClient } from "@/services/apiClient";

export function ClientsPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const deferredSearch = useDeferredValue(search);
  const { data = [], error, isLoading, isError } = useClientsQuery(deferredSearch);
  const { data: plans = [], isError: isPlansError } = useQuery({
    queryKey: ["service-plan-memberships"],
    queryFn: async () => (await apiClient.get<ClientPlanMembership[]>("/service-plan-memberships")).data,
  });

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
            className="min-w-0 flex-1 border-0 bg-transparent p-0 text-base text-ink outline-none placeholder:text-slate-400"
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar clientes..."
            value={search}
          />
          <Button
            className="hidden shrink-0 xl:inline-flex"
            onClick={() => navigate("/clientes/novo")}
            type="button"
          >
            Novo cliente
          </Button>
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

      {isPlansError ? <p className="text-sm text-rose-600" role="alert">Nao foi possivel carregar os planos vinculados aos clientes.</p> : null}

      {!isLoading && !isError ? (
        <ClientList
          items={data}
          plans={plans}
          onEdit={(client) => navigate(`/clientes/${client.id}/editar`)}
          onOpenAppointment={(appointment) => navigate(`/agenda/${appointment.id}`)}
          onSelect={(client) =>
            setSelectedClientId((currentClientId) => (currentClientId === client.id ? null : client.id))
          }
          selectedClientId={selectedClientId}
        />
      ) : null}

      <FloatingActionButton label="Novo" onClick={() => navigate("/clientes/novo")} />
    </section>
  );
}
