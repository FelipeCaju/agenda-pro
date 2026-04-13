import { useDeferredValue, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { MobilePageHeader } from "@/components/layout/mobile-page-header";
import { RecurringChargeList } from "@/components/recurrence/recurring-charge-list";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useClientsQuery } from "@/hooks/use-clients-query";
import { useRecurrenceMutations } from "@/hooks/use-recurrence-mutations";
import { useRecurringChargesQuery } from "@/hooks/use-recurrence-query";
import { useServicesQuery } from "@/hooks/use-services-query";
import type { RecurringCharge } from "@/services/recurrenceService";

type ChargesLocationState = {
  profileId?: string;
};

export function RecurringChargesPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state as ChargesLocationState | null) ?? null;
  const [clientId, setClientId] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [status, setStatus] = useState<"all" | "pendente" | "pago" | "vencido" | "cancelado">("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedCharge, setSelectedCharge] = useState<RecurringCharge | null>(null);
  const [dialogMode, setDialogMode] = useState<"pay" | "cancel" | null>(null);

  const filters = useMemo(
    () => ({
      clientId,
      serviceId,
      status,
      startDate,
      endDate,
      profileId: state?.profileId ?? "",
    }),
    [clientId, endDate, serviceId, startDate, state?.profileId, status],
  );
  const deferredFilters = useDeferredValue(filters);

  const { data: clients = [] } = useClientsQuery();
  const { data: services = [] } = useServicesQuery();
  const { data: charges = [], error, isError, isLoading } = useRecurringChargesQuery(deferredFilters);
  const {
    cancelCharge,
    isCancellingCharge,
    isPayingCharge,
    isResendingWhatsapp,
    payCharge,
    resendChargeWhatsapp,
  } = useRecurrenceMutations();

  async function handleConfirm() {
    if (!selectedCharge || !dialogMode) {
      return;
    }

    if (dialogMode === "pay") {
      await payCharge({ chargeId: selectedCharge.id });
    } else {
      await cancelCharge({ chargeId: selectedCharge.id });
    }

    setDialogMode(null);
    setSelectedCharge(null);
  }

  return (
    <section className="space-y-4 pb-24">
      <MobilePageHeader
        action={
          <Button onClick={() => navigate("/recorrencia")} type="button" variant="secondary">
            Voltar
          </Button>
        }
        subtitle="Pendentes, pagas, vencidas e canceladas"
        title="Cobrancas recorrentes"
      />

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <select className="app-input" onChange={(event) => setClientId(event.target.value)} value={clientId}>
          <option value="">Todos os clientes</option>
          {clients.map((client) => (
            <option key={client.id} value={client.id}>
              {client.nome}
            </option>
          ))}
        </select>

        <select className="app-input" onChange={(event) => setServiceId(event.target.value)} value={serviceId}>
          <option value="">Todos os servicos</option>
          {services.map((service) => (
            <option key={service.id} value={service.id}>
              {service.nome}
            </option>
          ))}
        </select>

        <select className="app-input" onChange={(event) => setStatus(event.target.value as typeof status)} value={status}>
          <option value="all">Todos os status</option>
          <option value="pendente">Pendentes</option>
          <option value="pago">Pagas</option>
          <option value="vencido">Vencidas</option>
          <option value="cancelado">Canceladas</option>
        </select>

        <input
          className="app-input"
          onChange={(event) => setStartDate(event.target.value)}
          type="date"
          value={startDate}
        />

        <input
          className="app-input"
          onChange={(event) => setEndDate(event.target.value)}
          type="date"
          value={endDate}
        />
      </div>

      {isLoading ? (
        <Card>
          <p className="text-sm text-slate-500">Carregando cobrancas...</p>
        </Card>
      ) : null}

      {isError ? (
        <Card className="app-message-error">
          <p className="text-sm font-medium">{error.message}</p>
        </Card>
      ) : null}

      {!isLoading && !isError ? (
        <RecurringChargeList
          items={charges}
          onCancel={(charge) => {
            setSelectedCharge(charge);
            setDialogMode("cancel");
          }}
          onMarkPaid={(charge) => {
            setSelectedCharge(charge);
            setDialogMode("pay");
          }}
          onOpenProfile={(charge) => navigate(`/recorrencia/${charge.recurringProfileId}/editar`)}
          onResendWhatsapp={(charge) => void resendChargeWhatsapp(charge.id)}
        />
      ) : null}

      <ConfirmationDialog
        cancelAction={{
          label: "Voltar",
          onClick: () => {
            setDialogMode(null);
            setSelectedCharge(null);
          },
        }}
        confirmAction={{
          label:
            dialogMode === "pay"
              ? isPayingCharge
                ? "Salvando..."
                : "Marcar pago"
              : isCancellingCharge
                ? "Cancelando..."
                : "Cancelar cobranca",
          onClick: () => void handleConfirm(),
          disabled: isPayingCharge || isCancellingCharge,
          variant: dialogMode === "pay" ? "primary" : "danger",
        }}
        description={
          dialogMode === "pay"
            ? "A cobranca sera marcada como paga agora, sem criar nenhum evento na agenda."
            : "A cobranca permanecera no historico, mas deixara de ser cobrada."
        }
        open={Boolean(dialogMode && selectedCharge)}
        title={dialogMode === "pay" ? "Confirmar pagamento" : "Cancelar cobranca"}
      />

      {isResendingWhatsapp ? (
        <Card>
          <p className="text-sm text-slate-500">Reenviando WhatsApp...</p>
        </Card>
      ) : null}
    </section>
  );
}
