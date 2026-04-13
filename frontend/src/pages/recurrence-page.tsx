import { useDeferredValue, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MobilePageHeader } from "@/components/layout/mobile-page-header";
import { RecurrenceProfileList } from "@/components/recurrence/recurrence-profile-list";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SearchIcon } from "@/components/ui/icons";
import { FloatingActionButton } from "@/components/ui/floating-action-button";
import { useClientsQuery } from "@/hooks/use-clients-query";
import { useRecurrenceMutations } from "@/hooks/use-recurrence-mutations";
import {
  useRecurringProfilesQuery,
  useRecurringSummaryQuery,
} from "@/hooks/use-recurrence-query";
import { useServicesQuery } from "@/hooks/use-services-query";
import type { RecurringProfile } from "@/services/recurrenceService";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function RecurrencePage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"all" | "true" | "false">("all");
  const [selectedProfile, setSelectedProfile] = useState<RecurringProfile | null>(null);
  const [dialogMode, setDialogMode] = useState<"delete" | "toggle" | null>(null);
  const deferredSearch = useDeferredValue(search);

  const { data: clients = [] } = useClientsQuery();
  const { data: services = [] } = useServicesQuery();
  const { data: summary } = useRecurringSummaryQuery();
  const { data: profiles = [], error, isError, isLoading } = useRecurringProfilesQuery({
    search: deferredSearch,
    ativo: status,
  });
  const { deleteProfile, toggleProfileActive, isDeletingProfile, isTogglingProfile } =
    useRecurrenceMutations();

  async function handleConfirm() {
    if (!selectedProfile || !dialogMode) {
      return;
    }

    if (dialogMode === "delete") {
      await deleteProfile(selectedProfile.id);
    } else {
      await toggleProfileActive({
        profileId: selectedProfile.id,
        ativo: !selectedProfile.ativo,
      });
    }

    setDialogMode(null);
    setSelectedProfile(null);
  }

  return (
    <section className="space-y-4 pb-24">
      <MobilePageHeader
        subtitle="Recorrencias e cobrancas mensais"
        title="Recorrencia"
      />

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <Card>
          <p className="text-sm text-slate-500">Recorrencias ativas</p>
          <p className="mt-2 text-2xl font-semibold text-ink">{summary?.activeProfiles ?? 0}</p>
        </Card>
        <Card>
          <p className="text-sm text-slate-500">Pendentes do mes</p>
          <p className="mt-2 text-2xl font-semibold text-ink">{summary?.pendingCharges ?? 0}</p>
        </Card>
        <Card>
          <p className="text-sm text-slate-500">Pagas do mes</p>
          <p className="mt-2 text-2xl font-semibold text-ink">{summary?.paidCharges ?? 0}</p>
        </Card>
        <Card>
          <p className="text-sm text-slate-500">Vencidas do mes</p>
          <p className="mt-2 text-2xl font-semibold text-ink">{summary?.overdueCharges ?? 0}</p>
        </Card>
        <Card>
          <p className="text-sm text-slate-500">Valor pendente</p>
          <p className="mt-2 text-2xl font-semibold text-ink">
            {formatCurrency(summary?.totalPendingAmount ?? 0)}
          </p>
        </Card>
      </div>

      <div className="grid gap-3 md:grid-cols-[1fr_180px_180px]">
        <Card className="rounded-[18px] border border-slate-200/70 bg-white px-4 py-3">
          <div className="flex items-center gap-3 text-slate-400">
            <SearchIcon className="h-5 w-5" />
            <input
              className="w-full border-0 bg-transparent p-0 text-base text-ink outline-none placeholder:text-slate-400"
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar recorrencias..."
              value={search}
            />
          </div>
        </Card>

        <select
          className="app-input"
          onChange={(event) => setStatus(event.target.value as "all" | "true" | "false")}
          value={status}
        >
          <option value="all">Todos os status</option>
          <option value="true">Ativas</option>
          <option value="false">Inativas</option>
        </select>

        <Button onClick={() => navigate("/recorrencia/cobrancas")} type="button" variant="secondary">
          Ver cobrancas
        </Button>
      </div>

      {isLoading ? (
        <Card>
          <p className="text-sm text-slate-500">Carregando recorrencias...</p>
        </Card>
      ) : null}

      {isError ? (
        <Card className="app-message-error">
          <p className="text-sm font-medium">{error.message}</p>
        </Card>
      ) : null}

      {!isLoading && !isError ? (
        <RecurrenceProfileList
          clients={clients}
          items={profiles}
          onCreate={() => navigate("/recorrencia/nova")}
          onDelete={(profile) => {
            setSelectedProfile(profile);
            setDialogMode("delete");
          }}
          onEdit={(profile) => navigate(`/recorrencia/${profile.id}/editar`)}
          onToggleActive={(profile) => {
            setSelectedProfile(profile);
            setDialogMode("toggle");
          }}
          onViewCharges={(profile) =>
            navigate("/recorrencia/cobrancas", { state: { profileId: profile.id } })
          }
          services={services}
        />
      ) : null}

      <ConfirmationDialog
        cancelAction={{
          label: "Voltar",
          onClick: () => {
            setDialogMode(null);
            setSelectedProfile(null);
          },
        }}
        confirmAction={{
          label:
            dialogMode === "delete"
              ? isDeletingProfile
                ? "Excluindo..."
                : "Excluir"
              : isTogglingProfile
                ? "Salvando..."
                : selectedProfile?.ativo
                  ? "Inativar"
                  : "Ativar",
          onClick: () => void handleConfirm(),
          disabled: isDeletingProfile || isTogglingProfile,
          variant: dialogMode === "delete" ? "danger" : "primary",
        }}
        description={
          dialogMode === "delete"
            ? "Esta acao so funciona se a recorrencia ainda nao tiver cobrancas geradas."
            : selectedProfile?.ativo
              ? "A recorrencia deixa de gerar novas cobrancas, mas o historico atual e preservado."
              : "A recorrencia volta a participar da geracao automatica."
        }
        open={Boolean(dialogMode && selectedProfile)}
        title={
          dialogMode === "delete"
            ? "Excluir recorrencia"
            : selectedProfile?.ativo
              ? "Inativar recorrencia"
              : "Ativar recorrencia"
        }
      />

      <FloatingActionButton label="Nova" onClick={() => navigate("/recorrencia/nova")} />
    </section>
  );
}
