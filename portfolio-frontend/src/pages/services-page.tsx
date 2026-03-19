import { useDeferredValue, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { MobilePageHeader } from "@/components/layout/mobile-page-header";
import { ServiceList } from "@/components/services/service-list";
import { Card } from "@/components/ui/card";
import { FloatingActionButton } from "@/components/ui/floating-action-button";
import { SearchIcon } from "@/components/ui/icons";
import { useServicesQuery } from "@/hooks/use-services-query";

type ServicesLocationState = {
  successMessage?: string;
};

export function ServicesPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [search, setSearch] = useState("");
  const [successMessage, setSuccessMessage] = useState(
    (location.state as ServicesLocationState | null)?.successMessage ?? "",
  );
  const deferredSearch = useDeferredValue(search);
  const { data = [], error, isLoading, isError } = useServicesQuery(deferredSearch);

  useEffect(() => {
    if (!successMessage) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setSuccessMessage("");
      navigate(location.pathname, { replace: true, state: null });
    }, 3000);

    return () => window.clearTimeout(timeoutId);
  }, [location.pathname, navigate, successMessage]);

  return (
    <section className="space-y-4">
      <MobilePageHeader
        subtitle={`${data.length} cadastrados`}
        title="Servicos"
      />

      <Card className="rounded-[18px] border border-slate-200/70 bg-white px-4 py-3 shadow-[0_4px_16px_rgba(15,23,36,0.05)]">
        <div className="flex items-center gap-3 text-slate-400">
          <SearchIcon className="h-5 w-5" />
          <input
            className="w-full border-0 bg-transparent p-0 text-base text-ink outline-none placeholder:text-slate-400"
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar servicos..."
            value={search}
          />
        </div>
      </Card>

      {successMessage ? (
        <Card className="app-message-success">
          <p className="text-sm font-medium text-emerald-700">{successMessage}</p>
        </Card>
      ) : null}

      {isLoading ? (
        <Card className="bg-white">
          <p className="text-sm text-slate-500">Carregando servicos...</p>
        </Card>
      ) : null}

      {isError ? (
        <Card className="app-message-error">
          <p className="text-sm font-medium">{error.message}</p>
        </Card>
      ) : null}

      {!isLoading && !isError ? (
        <ServiceList
          items={data}
          onCreate={() => navigate("/servicos/novo")}
          onEdit={(service) => navigate(`/servicos/${service.id}/editar`)}
        />
      ) : null}

      <FloatingActionButton label="Novo" onClick={() => navigate("/servicos/novo")} />
    </section>
  );
}
