import { useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { MobilePageHeader } from "@/components/layout/mobile-page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useProfessionalsQuery } from "@/hooks/use-professionals-query";
import {
  useOrganizationPaymentsQuery,
  useOrganizationQuery,
} from "@/hooks/use-organization-query";
import {
  getBillingPaymentAccessFromOrganization,
  getBillingAlert,
  getPaymentStatusLabel,
  getSubscriptionStatusLabel,
} from "@/utils/billing";
import { formatDateBR, formatMonthYearBR } from "@/utils/date";
import { buildNavigationState } from "@/utils/navigation";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

const SYSTEM_VERSION = "1.0.0.1";
const SYSTEM_UPDATED_AT = "09/04/2026";

export function ManagementPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { data: organization, error: organizationError, isLoading: isLoadingOrganization } =
    useOrganizationQuery();
  const {
    data: professionals = [],
    error: professionalsError,
    isLoading: isLoadingProfessionals,
  } = useProfessionalsQuery();
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

  const isLoading = isLoadingOrganization || isLoadingProfessionals || isLoadingPayments;
  const isInitialLoading = isLoading && !organization;

  return (
    <section className="space-y-4 xl:space-y-5">
      <MobilePageHeader
        action={
          <Button
            className="min-h-8 rounded-xl px-3 py-2 text-xs md:min-h-[46px] md:rounded-[18px] md:px-4 md:py-3 md:text-sm"
            onClick={() => navigate("/configuracoes")}
            type="button"
            variant="secondary"
          >
            Configuracoes
          </Button>
        }
        subtitle="Pagamento, equipe e operacao"
        title="Gestao"
      />

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
      {professionalsError ? (
        <Card className="app-message-error">
          <p className="text-sm font-medium text-rose-700">{professionalsError.message}</p>
        </Card>
      ) : null}
      {paymentsError ? (
        <Card className="app-message-error">
          <p className="text-sm font-medium text-rose-700">{paymentsError.message}</p>
        </Card>
      ) : null}

      {billingAlert.hasAlert ? (
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
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3 xl:gap-4">
            <Card className="xl:min-h-[270px]">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Empresa</p>
              <h3 className="mt-2 text-lg font-semibold text-ink">{organization.nomeEmpresa}</h3>
              <div className="mt-4 space-y-2 text-sm text-slate-600">
                <p>{organization.emailResponsavel}</p>
                <p>{organization.telefone || "Telefone nao informado"}</p>
                <p>Plano {organization.subscriptionPlan}</p>
                <p>Status {getSubscriptionStatusLabel(organization.subscriptionStatus)}</p>
              </div>
            </Card>

            <Card className="xl:min-h-[270px]">
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

            <Card className="xl:min-h-[270px]">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Acoes</p>
              <h3 className="mt-2 text-lg font-semibold text-ink">Atalhos uteis</h3>
              <div className="mt-4 flex flex-col gap-3">
                <Button onClick={() => navigate("/funcionarios")} type="button">
                  Abrir funcionarios
                </Button>
                <Button
                  onClick={() => navigate("/meu-plano", { state: buildNavigationState(location.pathname) })}
                  type="button"
                  variant="secondary"
                >
                  Abrir meu plano
                </Button>
                <Button
                  onClick={() => navigate("/faturas", { state: buildNavigationState(location.pathname) })}
                  type="button"
                  variant="secondary"
                >
                  Abrir faturas
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
          </div>

          <div className="grid gap-4 xl:grid-cols-[1.12fr_0.88fr] xl:gap-5">
            <Card className="xl:min-h-[100%]">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Pagamentos</p>
                  <h3 className="mt-1 text-lg font-semibold text-ink">Ultima cobranca</h3>
                </div>
                <Button
                  onClick={() => navigate("/faturas", { state: buildNavigationState(location.pathname) })}
                  type="button"
                  variant="secondary"
                >
                  Ver faturas
                </Button>
              </div>

              <div className="mt-4 space-y-3">
                {latestPayment ? (
                  <div
                    className="flex items-start justify-between gap-3 rounded-2xl border border-slate-100 bg-slate-50/80 px-3 py-3"
                    key={latestPayment.id}
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-ink">{formatMonthYearBR(latestPayment.referenceMonth)}</p>
                      <p className="text-sm text-slate-500">
                        Vence em {formatDateBR(latestPayment.dueDate)}
                      </p>
                      {latestPayment.paidAt ? (
                        <p className="text-sm text-slate-500">
                          Pago em {formatDateBR(latestPayment.paidAt)}
                        </p>
                      ) : null}
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-ink">{formatCurrency(latestPayment.amount)}</p>
                      <p className="mt-1 text-xs font-semibold uppercase tracking-[0.16em] text-brand-600">
                        {getPaymentStatusLabel(latestPayment.status)}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">Nenhum pagamento registrado ainda.</p>
                )}
              </div>
            </Card>

            <Card className="xl:min-h-[100%]">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Equipe</p>
                <h3 className="mt-1 text-lg font-semibold text-ink">Funcionarios da empresa</h3>
              </div>

              <div className="mt-4 space-y-3">
                {professionals.length ? (
                  professionals.map((professional) => (
                    <div
                      className="flex items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-slate-50/80 px-3 py-3"
                      key={professional.id}
                    >
                      <div>
                        <p className="font-medium text-ink">{professional.nome}</p>
                        <p className="text-sm text-slate-500">
                          {professional.atividade || "Atividade nao informada"}
                        </p>
                      </div>
                      <div className="text-right text-xs">
                        <p className={professional.ativo ? "text-emerald-600" : "text-slate-400"}>
                          {professional.ativo ? "Ativo" : "Inativo"}
                        </p>
                        <p className="mt-1 text-slate-400">
                          {professional.serviceIds.length} servico(s)
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">Nenhum funcionario cadastrado ainda.</p>
                )}
              </div>
            </Card>
          </div>

          <div className="flex justify-center xl:justify-end">
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/80 px-4 py-2 text-xs text-slate-500 shadow-[0_10px_24px_rgba(15,23,42,0.05)]">
              <span className="font-semibold uppercase tracking-[0.18em] text-slate-400">Sistema</span>
              <span className="text-slate-300">•</span>
              <span className="font-medium text-slate-600">V {SYSTEM_VERSION}</span>
              <span className="text-slate-300">•</span>
              <span>Atualizado em {SYSTEM_UPDATED_AT}</span>
            </div>
          </div>
        </>
      ) : null}
    </section>
  );
}
