import { useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { MobilePageHeader } from "@/components/layout/mobile-page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  useOrganizationPaymentsQuery,
  useOrganizationQuery,
} from "@/hooks/use-organization-query";
import {
  getBillingPaymentAccessFromOrganization,
  getBillingAlert,
  getPaymentStatusLabel,
} from "@/utils/billing";
import { formatDateBR } from "@/utils/date";
import { buildNavigationState } from "@/utils/navigation";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

type ManagementPageProps = {
  embedded?: boolean;
  showPayment?: boolean;
  showShortcuts?: boolean;
};

export function ManagementPage({
  embedded = false,
  showPayment = true,
  showShortcuts = true,
}: ManagementPageProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { data: organization, error: organizationError, isLoading: isLoadingOrganization } =
    useOrganizationQuery();
  const {
    data: payments = [],
    error: paymentsError,
    isLoading: isLoadingPayments,
  } = useOrganizationPaymentsQuery();
  const billingAlert = useMemo(() => getBillingAlert(organization, payments), [organization, payments]);
  const latestPayment = payments[0] ?? null;
  const paymentAccess = useMemo(
    () => getBillingPaymentAccessFromOrganization(organization, latestPayment),
    [latestPayment, organization],
  );

  const isLoading = isLoadingOrganization || isLoadingPayments;
  const isInitialLoading = isLoading && !organization;

  return (
    <section className="space-y-4 xl:space-y-5">
      {!embedded ? <MobilePageHeader subtitle="Pagamento, equipe e operacao" title="Gestao" /> : null}

      {isInitialLoading ? (
        <Card>
          <p className="text-sm text-slate-500">Carregando dados de gestao...</p>
        </Card>
      ) : null}

      {organizationError ? (
        <Card className="app-message-error">
          <p className="text-sm font-medium text-rose-700">{organizationError.message}</p>
        </Card>
      ) : null}
      {paymentsError ? (
        <Card className="app-message-error">
          <p className="text-sm font-medium text-rose-700">{paymentsError.message}</p>
        </Card>
      ) : null}

      {showPayment && billingAlert.hasAlert ? (
        <Card
          className={
            billingAlert.tone === "danger"
              ? "border border-rose-100 bg-rose-50/80"
              : "border border-amber-100 bg-amber-50/80"
          }
        >
          <p
            className={
              billingAlert.tone === "danger"
                ? "text-sm font-semibold text-rose-700"
                : "text-sm font-semibold text-amber-700"
            }
          >
            {billingAlert.title}
          </p>
          <p
            className={
              billingAlert.tone === "danger"
                ? "mt-2 text-sm text-rose-600"
                : "mt-2 text-sm text-amber-700"
            }
          >
            {billingAlert.description}
          </p>
        </Card>
      ) : null}

      {organization ? (
        <>
          <div className={showPayment && showShortcuts ? "grid gap-3 md:grid-cols-2 xl:grid-cols-3 xl:gap-4" : "grid gap-3"}>
            {showPayment ? (
            <Card>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Pagamento</p>
              <h3 className="mt-2 text-lg font-semibold text-ink">Situacao da assinatura</h3>
              <div className="mt-4 space-y-2 text-sm text-slate-600">
                <p>Vencimento {formatDateBR(organization.dueDate)}</p>
                {organization.graceUntil ? <p>Bloqueio apos {formatDateBR(organization.graceUntil)}</p> : null}
                <p>
                  Ultimo status {latestPayment ? getPaymentStatusLabel(latestPayment.status) : "Sem historico"}
                </p>
                <p>
                  Ultimo valor {latestPayment ? formatCurrency(latestPayment.amount) : "Nao informado"}
                </p>
                {organization.pixKey ? <p>Pix disponivel para pagamento por QR Code.</p> : null}
              </div>

              {organization.pixKey ? (
                <>
                  <Button
                    className="mt-4 w-full sm:w-auto"
                    disabled={!paymentAccess.canOpen}
                    onClick={() => navigate("/pagamento", { state: buildNavigationState(location.pathname) })}
                    type="button"
                  >
                    Abrir pagamentos
                  </Button>
                  {!paymentAccess.canOpen ? (
                    <p className="mt-3 text-sm text-slate-500">{paymentAccess.reason}</p>
                  ) : null}
                </>
              ) : null}

              {organization.paymentNoticeVisible && latestPayment?.status !== "paid" ? (
                <div className="mt-4 space-y-3 rounded-2xl border border-amber-100 bg-amber-50/80 px-4 py-4">
                  <p className="text-sm font-semibold text-amber-800">
                    Pagamento disponivel para regularizacao
                  </p>
                  <p className="text-sm text-amber-700">
                    Quando o gateway confirmar o pagamento, a assinatura e liberada automaticamente.
                  </p>
                  {organization.pixKey ? (
                    <Button
                      disabled={!paymentAccess.canOpen}
                      onClick={() => navigate("/pagamento", { state: buildNavigationState(location.pathname) })}
                      type="button"
                    >
                      Abrir pagamentos
                    </Button>
                  ) : null}
                </div>
              ) : null}
            </Card>
            ) : null}

            {showShortcuts ? (
            <Card>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Acoes</p>
              <h3 className="mt-2 text-lg font-semibold text-ink">Atalhos</h3>
              <div className="mt-4 flex flex-col gap-3">
                <Button onClick={() => navigate("/funcionarios")} type="button">
                  Abrir funcionarios
                </Button>
                <Button
                  onClick={() => navigate("/bloqueios", { state: buildNavigationState(location.pathname) })}
                  type="button"
                  variant="secondary"
                >
                  Abrir bloqueios
                </Button>
              </div>
            </Card>
            ) : null}
          </div>

        </>
      ) : null}
    </section>
  );
}
