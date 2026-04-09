import { useNavigate } from "react-router-dom";
import { MobilePageHeader } from "@/components/layout/mobile-page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FullscreenState } from "@/components/ui/fullscreen-state";
import { useBillingMutations } from "@/hooks/use-billing-mutations";
import { useBillingOverviewQuery } from "@/hooks/use-billing-query";
import { getBillingPaymentAccessFromOverview, getSubscriptionStatusLabel } from "@/utils/billing";
import { formatDateBR } from "@/utils/date";

function formatCurrencyFromCents(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(value ?? 0) / 100);
}

export function BillingPlanPage() {
  const navigate = useNavigate();
  const { data: overview, error, isError, isLoading } = useBillingOverviewQuery();
  const {
    cancelSubscription,
    reactivateSubscription,
    isCancellingSubscription,
    isReactivatingSubscription,
    cancelSubscriptionError,
    reactivateSubscriptionError,
  } = useBillingMutations();

  if (isLoading && !overview) {
    return (
      <FullscreenState
        eyebrow="Billing"
        title="Carregando meu plano"
        description="Estamos trazendo a situacao atual da sua assinatura."
      />
    );
  }

  if (isError || !overview) {
    return (
      <FullscreenState
        eyebrow="Billing"
        title="Nao foi possivel abrir o plano"
        description={error?.message ?? "Falha ao carregar billing."}
      />
    );
  }

  const paymentAccess = getBillingPaymentAccessFromOverview(overview.access, overview.currentCharge);

  return (
    <section className="space-y-4">
      <MobilePageHeader
        action={
          <Button onClick={() => navigate("/gestao")} type="button" variant="secondary">
            Voltar
          </Button>
        }
        subtitle="Assinatura e acesso"
        title="Meu Plano"
      />

      <Card className="space-y-4">
        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Plano atual</p>
        <div className="space-y-2 text-sm text-slate-600">
          <p>
            Nome: <strong className="text-ink">{overview.plan?.name ?? "AgendaPro Mensal"}</strong>
          </p>
          <p>
            Valor:{" "}
            <strong className="text-ink">
              {formatCurrencyFromCents(overview.subscription?.amountCents ?? overview.plan?.priceCents ?? 0)}
            </strong>
          </p>
          <p>
            Status:{" "}
            <strong className="text-ink">
              {getSubscriptionStatusLabel(overview.access.subscriptionStatus)}
            </strong>
          </p>
          {overview.access.dueDate ? (
            <p>
              Proximo vencimento:{" "}
              <strong className="text-ink">{formatDateBR(overview.access.dueDate)}</strong>
            </p>
          ) : null}
          {overview.access.graceUntil ? (
            <p>
              Tolerancia ate:{" "}
              <strong className="text-ink">{formatDateBR(overview.access.graceUntil)}</strong>
            </p>
          ) : null}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button disabled={!paymentAccess.canOpen} onClick={() => navigate("/pagamento")} type="button">
            Abrir pagamentos
          </Button>
          <Button onClick={() => navigate("/faturas")} type="button" variant="secondary">
            Ver faturas
          </Button>
        </div>
        {!paymentAccess.canOpen ? <p className="text-sm text-slate-500">{paymentAccess.reason}</p> : null}
      </Card>

      <Card className="space-y-4">
        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Gerenciar assinatura</p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button
            disabled={isReactivatingSubscription}
            onClick={() => void reactivateSubscription()}
            type="button"
          >
            {isReactivatingSubscription ? "Reativando..." : "Reativar assinatura"}
          </Button>
          <Button
            disabled={isCancellingSubscription}
            onClick={() => void cancelSubscription()}
            type="button"
            variant="secondary"
          >
            {isCancellingSubscription ? "Cancelando..." : "Cancelar assinatura"}
          </Button>
        </div>

        {reactivateSubscriptionError ? (
          <p className="text-sm text-rose-600">{reactivateSubscriptionError.message}</p>
        ) : null}
        {cancelSubscriptionError ? (
          <p className="text-sm text-rose-600">{cancelSubscriptionError.message}</p>
        ) : null}
      </Card>
    </section>
  );
}
