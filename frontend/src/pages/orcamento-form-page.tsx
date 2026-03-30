import { useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { OrcamentoForm } from "@/components/orcamentos/orcamento-form";
import { MobilePageHeader } from "@/components/layout/mobile-page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { InlineStateCard } from "@/components/ui/inline-state-card";
import { useClientQuery } from "@/hooks/use-client-query";
import { useClientsQuery } from "@/hooks/use-clients-query";
import { useOrcamentoMutations } from "@/hooks/use-orcamento-mutations";
import { useOrcamentoQuery } from "@/hooks/use-orcamento-query";
import { useOrganizationQuery } from "@/hooks/use-organization-query";
import { useServicesQuery } from "@/hooks/use-services-query";
import { orcamentoService, type OrcamentoInput } from "@/services/orcamentoService";
import {
  buildQuoteWhatsappMessageFromQuote,
  openWhatsappConversation,
} from "@/utils/whatsapp";

function getStatusLabel(status?: string) {
  if (status === "aprovado") return "Aprovado";
  if (status === "recusado") return "Recusado";
  return "Pendente";
}

export function OrcamentoFormPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { quoteId } = useParams();
  const isEditing = Boolean(quoteId);
  const [actionError, setActionError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState(
    ((location.state as { successMessage?: string } | null)?.successMessage ?? ""),
  );
  const { data: quote, error, isError, isLoading } = useOrcamentoQuery(quoteId);
  const { data: client } = useClientQuery(quote?.clientId);
  const { data: organization } = useOrganizationQuery();
  const { data: clients = [], isLoading: isLoadingClients, isError: isClientsError, error: clientsError } = useClientsQuery();
  const { data: services = [], isLoading: isLoadingServices, isError: isServicesError, error: servicesError } = useServicesQuery();
  const {
    approveOrcamento,
    approveError,
    convertOrcamentoToOS,
    convertToOSError,
    createError,
    createOrcamento,
    isApproving,
    isConvertingToOS,
    isCreating,
    isRejecting,
    isUpdating,
    rejectError,
    rejectOrcamento,
    updateError,
    updateOrcamento,
  } = useOrcamentoMutations();

  const initialValues = useMemo(
    () =>
      quote
        ? {
            clientId: quote.clientId,
            discount: String(quote.discount),
            notes: quote.notes,
            items: quote.items.map((item) => ({
              id: item.id,
              serviceId: item.serviceId ?? "",
              description: item.freeDescription || item.serviceName,
              quantity: String(item.quantity),
              unitPrice: String(item.unitPrice),
              notes: item.notes,
            })),
          }
        : undefined,
    [quote],
  );

  async function handleSubmit(input: OrcamentoInput) {
    setActionError(null);

    try {
      if (quoteId) {
        await updateOrcamento({ quoteId, input });
        setSuccessMessage("Orcamento atualizado com sucesso.");
        return;
      }

      const created = await createOrcamento(input);
      navigate(`/orcamentos/${created.id}`, {
        replace: true,
        state: { successMessage: "Orcamento criado com sucesso." },
      });
    } catch {
      return;
    }
  }

  async function handleApprove() {
    if (!quoteId) return;
    setActionError(null);

    try {
      await approveOrcamento(quoteId);
      setSuccessMessage("Orcamento aprovado com sucesso.");
    } catch {
      return;
    }
  }

  async function handleReject() {
    if (!quoteId) return;
    setActionError(null);

    try {
      await rejectOrcamento(quoteId);
      setSuccessMessage("Orcamento recusado com sucesso.");
    } catch {
      return;
    }
  }

  async function handleSchedule() {
    if (!quoteId) return;
    setActionError(null);

    try {
      const draft = await orcamentoService.createAppointmentDraft(quoteId);
      navigate("/agenda/novo", {
        state: {
          prefillFromQuote: draft,
        },
      });
    } catch (draftError) {
      setActionError(draftError instanceof Error ? draftError.message : "Falha ao abrir agendamento.");
    }
  }

  async function handleConvertToServiceOrder() {
    if (!quoteId) return;
    setActionError(null);

    try {
      await convertOrcamentoToOS(quoteId);
      setSuccessMessage("Orcamento convertido em ordem de servico.");
    } catch {
      return;
    }
  }

  function handleSendToWhatsapp() {
    if (!quote) {
      return;
    }

    setActionError(null);

    try {
      const message = buildQuoteWhatsappMessageFromQuote(
        quote,
        settingsOrganizationName(),
        client?.nome ?? quote.clientName,
      );
      openWhatsappConversation(client?.telefone ?? "", message);
    } catch (sendError) {
      setActionError(
        sendError instanceof Error
          ? sendError.message
          : "Nao foi possivel abrir o WhatsApp para este orcamento.",
      );
    }
  }

  function settingsOrganizationName() {
    return organization?.nomeEmpresa ?? "AgendaPro";
  }

  if (isLoading || isLoadingClients || isLoadingServices) {
    return <InlineStateCard message="Carregando orcamento..." />;
  }

  if (isError || isClientsError || isServicesError) {
    return (
      <InlineStateCard
        message={
          error?.message ??
          clientsError?.message ??
          servicesError?.message ??
          "Nao foi possivel carregar os dados do orcamento."
        }
        tone="error"
      />
    );
  }

  return (
    <section className="space-y-4 pb-8">
      <MobilePageHeader
        action={
          <Button onClick={() => navigate("/orcamentos")} type="button" variant="secondary">
            Voltar
          </Button>
        }
        subtitle={quote ? getStatusLabel(quote.status) : "Novo orcamento"}
        title={quote ? "Editar orcamento" : "Novo orcamento"}
      />

      {successMessage ? (
        <Card className="app-message-success">
          <p className="text-sm font-medium text-emerald-700">{successMessage}</p>
        </Card>
      ) : null}

      {actionError ? (
        <Card className="app-message-error">
          <p className="text-sm font-medium">{actionError}</p>
        </Card>
      ) : null}

      {quoteId && quote ? (
        <Card className="space-y-3">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Acoes</p>
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <Button
              disabled={quote.status !== "pendente" || isApproving}
              onClick={() => void handleApprove()}
              type="button"
            >
              {isApproving ? "Aprovando..." : "Aprovar"}
            </Button>
            <Button
              disabled={quote.status !== "pendente" || isRejecting}
              onClick={() => void handleReject()}
              type="button"
              variant="secondary"
            >
              {isRejecting ? "Recusando..." : "Recusar"}
            </Button>
            <Button onClick={() => void handleSchedule()} type="button" variant="secondary">
              Transformar em agendamento
            </Button>
            <Button
              disabled={isConvertingToOS}
              onClick={() => void handleConvertToServiceOrder()}
              type="button"
              variant="secondary"
            >
              {isConvertingToOS ? "Convertendo..." : "Transformar em OS"}
            </Button>
            <Button onClick={() => handleSendToWhatsapp()} type="button" variant="secondary">
              Enviar no WhatsApp
            </Button>
          </div>
          <p className="text-sm text-slate-500">
            O WhatsApp abre com uma mensagem pronta contendo cliente, itens e total do orcamento.
          </p>
          {quote.appointmentId ? (
            <p className="text-sm text-slate-500">Ja vinculado ao agendamento {quote.appointmentId}.</p>
          ) : null}
          {quote.serviceOrderId ? (
            <p className="text-sm text-slate-500">Ordem de servico vinculada: {quote.serviceOrderId}.</p>
          ) : null}
        </Card>
      ) : null}

      <OrcamentoForm
        clients={clients}
        errorMessage={
          createError?.message ??
          updateError?.message ??
          approveError?.message ??
          rejectError?.message ??
          convertToOSError?.message ??
          null
        }
        initialValues={initialValues}
        isLocked={quote?.status === "aprovado" || quote?.status === "recusado"}
        isSubmitting={isCreating || isUpdating}
        onSubmit={handleSubmit}
        services={services}
      />
    </section>
  );
}
