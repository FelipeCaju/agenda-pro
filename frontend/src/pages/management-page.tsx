import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MobilePageHeader } from "@/components/layout/mobile-page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useProfessionalsQuery } from "@/hooks/use-professionals-query";
import {
  useOrganizationPaymentsQuery,
  useOrganizationQuery,
} from "@/hooks/use-organization-query";
import { useOrganizationMutations } from "@/hooks/use-organization-mutations";
import {
  getBillingAlert,
  getPaymentStatusLabel,
  getSubscriptionStatusLabel,
} from "@/utils/billing";
import { formatDateBR, formatMonthYearBR } from "@/utils/date";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function ManagementPage() {
  const navigate = useNavigate();
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
  const { isNotifyingPaymentPaid, notifyPaymentPaid, notifyPaymentPaidError } =
    useOrganizationMutations();
  const billingAlert = useMemo(() => getBillingAlert(organization, payments), [organization, payments]);
  const latestPayment = payments[0] ?? null;
  const [paymentSignalMessage, setPaymentSignalMessage] = useState("");

  const isLoading = isLoadingOrganization || isLoadingProfessionals || isLoadingPayments;
  const isInitialLoading = isLoading && !organization;

  async function handleNotifyPaymentPaid() {
    if (!organization?.latestPaymentId) {
      return;
    }

    try {
      await notifyPaymentPaid({ paymentId: organization.latestPaymentId });
      setPaymentSignalMessage(
        "Aviso enviado para o administrador. A mensagem segue visivel ate a baixa do pagamento.",
      );
    } catch {
      return;
    }
  }

  return (
    <section className="space-y-4">
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

      {paymentSignalMessage ? (
        <Card className="app-message-success">
          <p className="text-sm font-medium text-emerald-700">{paymentSignalMessage}</p>
        </Card>
      ) : null}

      {organization ? (
        <>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            <Card>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Empresa</p>
              <h3 className="mt-2 text-lg font-semibold text-ink">{organization.nomeEmpresa}</h3>
              <div className="mt-4 space-y-2 text-sm text-slate-600">
                <p>{organization.emailResponsavel}</p>
                <p>{organization.telefone || "Telefone nao informado"}</p>
                <p>Plano {organization.subscriptionPlan}</p>
                <p>Status {getSubscriptionStatusLabel(organization.subscriptionStatus)}</p>
              </div>
            </Card>

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
                {latestPayment?.customerNotifiedPaidAt ? (
                  <p>Voce ja avisou o administrador sobre este pagamento.</p>
                ) : null}
              </div>

              {organization.pixKey ? (
                <Button
                  className="mt-4 w-full sm:w-auto"
                  onClick={() => navigate("/pagamento")}
                  type="button"
                >
                  {organization.subscriptionStatus === "trial"
                    ? "Comprar sistema"
                    : "Abrir pagamento Pix"}
                </Button>
              ) : null}

              {organization.paymentNoticeVisible && latestPayment?.status !== "paid" ? (
                <div className="mt-4 space-y-3 rounded-2xl border border-amber-100 bg-amber-50/80 px-4 py-4">
                  <p className="text-sm font-semibold text-amber-800">
                    Pagamento disponivel para regularizacao
                  </p>
                  <p className="text-sm text-amber-700">
                    Faca o pagamento via Pix e, se ja tiver pago, toque abaixo para avisar o administrador.
                  </p>
                  {organization.pixKey ? (
                    <Button onClick={() => navigate("/pagamento")} type="button">
                      Abrir QR Code Pix
                    </Button>
                  ) : null}
                  <Button
                    disabled={
                      isNotifyingPaymentPaid ||
                      !organization.latestPaymentId ||
                      Boolean(latestPayment?.customerNotifiedPaidAt)
                    }
                    onClick={() => void handleNotifyPaymentPaid()}
                    type="button"
                    variant="secondary"
                  >
                    {latestPayment?.customerNotifiedPaidAt
                      ? "Administrador ja avisado"
                      : isNotifyingPaymentPaid
                        ? "Enviando aviso..."
                        : "Ja paguei, avisar administrador"}
                  </Button>
                  {notifyPaymentPaidError ? (
                    <p className="text-sm text-rose-600">{notifyPaymentPaidError.message}</p>
                  ) : null}
                </div>
              ) : null}
            </Card>

            <Card>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Acoes</p>
              <h3 className="mt-2 text-lg font-semibold text-ink">Atalhos uteis</h3>
              <div className="mt-4 flex flex-col gap-3">
                <Button onClick={() => navigate("/funcionarios")} type="button">
                  Abrir funcionarios
                </Button>
                <Button onClick={() => navigate("/bloqueios")} type="button" variant="secondary">
                  Abrir bloqueios
                </Button>
              </div>
            </Card>
          </div>

          <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
            <Card>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Pagamentos</p>
                  <h3 className="mt-1 text-lg font-semibold text-ink">Historico de cobranca</h3>
                </div>
              </div>

              <div className="mt-4 space-y-3">
                {payments.length ? (
                  payments.map((payment) => (
                    <div
                      className="flex items-start justify-between gap-3 rounded-2xl border border-slate-100 bg-slate-50/80 px-3 py-3"
                      key={payment.id}
                    >
                      <div className="min-w-0">
                        <p className="font-medium text-ink">{formatMonthYearBR(payment.referenceMonth)}</p>
                        <p className="text-sm text-slate-500">
                          Vence em {formatDateBR(payment.dueDate)}
                        </p>
                        {payment.paidAt ? (
                          <p className="text-sm text-slate-500">
                            Pago em {formatDateBR(payment.paidAt)}
                          </p>
                        ) : null}
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-ink">{formatCurrency(payment.amount)}</p>
                        <p className="mt-1 text-xs font-semibold uppercase tracking-[0.16em] text-brand-600">
                          {getPaymentStatusLabel(payment.status)}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">Nenhum pagamento registrado ainda.</p>
                )}
              </div>
            </Card>

            <Card>
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
        </>
      ) : null}
    </section>
  );
}
