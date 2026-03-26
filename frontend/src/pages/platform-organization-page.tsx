import { FormEvent, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { MobilePageHeader } from "@/components/layout/mobile-page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAdminMutations } from "@/hooks/use-admin-mutations";
import { useAdminOrganizationQuery } from "@/hooks/use-admin-organization-query";
import type { AdminOrganizationPayment } from "@/services/adminService";
import { formatDateBR, formatMonthYearBR } from "@/utils/date";

const statusOptions = ["active", "overdue", "blocked", "trial", "canceled"] as const;

function getStatusAssinaturaLabel(status: (typeof statusOptions)[number]) {
  if (status === "active") return "Ativa";
  if (status === "overdue") return "Em atraso";
  if (status === "blocked") return "Bloqueada";
  if (status === "trial") return "Em teste";
  return "Cancelada";
}

function getStatusPagamentoLabel(status: "pending" | "paid" | "overdue" | "canceled") {
  if (status === "paid") return "Pago";
  if (status === "pending") return "Pendente";
  if (status === "overdue") return "Em atraso";
  return "Cancelado";
}

function getPlanoLabel(plan: string) {
  return plan === "trial" ? "Trial" : "Pro";
}

export function PlatformOrganizationPage() {
  const { organizationId } = useParams();
  const { data, error, isLoading, isError } = useAdminOrganizationQuery(organizationId);
  const {
    createPayment,
    createPaymentError,
    isCreatingPayment,
    isUpdatingSubscription,
    updateSubscription,
    updateSubscriptionError,
  } = useAdminMutations(organizationId);

  const organization = data?.organization;
  const normalizedPlan = organization?.subscriptionPlan === "trial" ? "trial" : "pro";
  const [subscriptionStatus, setSubscriptionStatus] = useState(organization?.subscriptionStatus ?? "active");
  const [subscriptionPlan, setSubscriptionPlan] = useState<"trial" | "pro">(normalizedPlan);
  const [monthlyAmount, setMonthlyAmount] = useState(String(organization?.monthlyAmount ?? 0));
  const [dueDate, setDueDate] = useState(organization?.dueDate ?? "");
  const [trialEnd, setTrialEnd] = useState(organization?.trialEnd ?? "");
  const [referenceMonth, setReferenceMonth] = useState(new Date().toISOString().slice(0, 7));
  const [amount, setAmount] = useState("0");
  const [paymentStatus, setPaymentStatus] = useState<"pending" | "paid" | "overdue" | "canceled">("paid");
  const [paymentMethod, setPaymentMethod] = useState("pix");
  const [paymentNotes, setPaymentNotes] = useState("");
  const [paidAt, setPaidAt] = useState(new Date().toISOString().slice(0, 16));
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    if (!organization) {
      return;
    }

    setSubscriptionStatus(organization.subscriptionStatus);
    setSubscriptionPlan(organization.subscriptionPlan === "trial" ? "trial" : "pro");
    setMonthlyAmount(String(organization.monthlyAmount ?? 0));
    setDueDate(organization.dueDate ?? "");
    setTrialEnd(organization.trialEnd ?? "");
  }, [organization]);

  async function handleSubscriptionSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      await updateSubscription({
        subscriptionStatus,
        subscriptionPlan,
        monthlyAmount: Number(monthlyAmount),
        dueDate: dueDate || null,
        trialEnd: trialEnd || null,
      });
      setSuccessMessage("Assinatura atualizada com sucesso.");
    } catch {
      return;
    }
  }

  async function handlePaymentSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      await createPayment({
        referenceMonth,
        amount: Number(amount),
        status: paymentStatus,
        paymentMethod,
        notes: paymentNotes,
        dueDate: dueDate || null,
        paidAt: paymentStatus === "paid" ? paidAt : null,
      });
      setSuccessMessage("Pagamento registrado com sucesso.");
    } catch {
      return;
    }
  }

  return (
    <section className="space-y-4">
      <MobilePageHeader
        leading={
          <Link className="inline-flex" to="/admin">
            <Button className="min-h-8 h-8 w-8 rounded-full p-0" type="button" variant="secondary">
              &lt;
            </Button>
          </Link>
        }
        subtitle={organization?.emailResponsavel ?? "Detalhes administrativos"}
        title={organization?.nomeEmpresa ?? "Empresa"}
      />

      {isLoading ? (
        <Card>
          <p className="text-sm text-slate-500">Carregando empresa...</p>
        </Card>
      ) : null}

      {isError ? (
        <Card className="app-message-error">
          <p className="text-sm font-medium">{error.message}</p>
        </Card>
      ) : null}

      {successMessage ? (
        <Card className="app-message-success">
          <p className="text-sm font-medium text-emerald-700">{successMessage}</p>
        </Card>
      ) : null}

      {organization ? (
        <>
          <Card>
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Empresa</p>
            <div className="mt-3 space-y-2 text-sm text-slate-600">
              <p>{organization.emailResponsavel}</p>
              <p>{organization.telefone || "Telefone nao informado"}</p>
              <p>Mensalidade: R$ {organization.monthlyAmount.toFixed(2)}</p>
              <p>Plano: {getPlanoLabel(organization.subscriptionPlan)}</p>
              <p>Status atual: {getStatusAssinaturaLabel(organization.subscriptionStatus)}</p>
            </div>
          </Card>

          <Card>
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Assinatura</p>
            <form className="mt-4 space-y-4" onSubmit={handleSubscriptionSubmit}>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-ink">Status</label>
                  <select
                    className="app-select"
                    onChange={(event) =>
                      setSubscriptionStatus(event.target.value as typeof statusOptions[number])
                    }
                    value={subscriptionStatus}
                  >
                    {statusOptions.map((option) => (
                      <option key={option} value={option}>
                        {getStatusAssinaturaLabel(option)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-ink">Plano</label>
                  <select
                    className="app-select"
                    onChange={(event) => setSubscriptionPlan(event.target.value as "trial" | "pro")}
                    value={subscriptionPlan}
                  >
                    <option value="trial">Trial</option>
                    <option value="pro">Pro</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-ink">Mensalidade</label>
                <input
                  className="app-input"
                  min="0"
                  onChange={(event) => setMonthlyAmount(event.target.value)}
                  step="0.01"
                  type="number"
                  value={monthlyAmount}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-ink">Vencimento</label>
                  <input
                    className="app-input"
                    onChange={(event) => setDueDate(event.target.value)}
                    type="date"
                    value={dueDate}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-ink">Fim do teste</label>
                  <input
                    className="app-input"
                    onChange={(event) => setTrialEnd(event.target.value)}
                    type="date"
                    value={trialEnd}
                  />
                </div>
              </div>

              {updateSubscriptionError ? (
                <p className="text-sm text-rose-600">{updateSubscriptionError.message}</p>
              ) : null}

              <Button disabled={isUpdatingSubscription} type="submit">
                {isUpdatingSubscription ? "Salvando..." : "Atualizar assinatura"}
              </Button>
            </form>
          </Card>

          <Card>
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Historico de pagamento</p>
            <div className="mt-4 space-y-3">
              {data.payments.length ? (
                data.payments.map((payment: AdminOrganizationPayment) => (
                  <div className="rounded-2xl border border-slate-200 px-4 py-3" key={payment.id}>
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold text-ink">{formatMonthYearBR(payment.referenceMonth)}</p>
                        <p className="text-sm text-slate-500">
                          R$ {payment.amount.toFixed(2)} - {getStatusPagamentoLabel(payment.status)}
                        </p>
                      </div>
                      <span className="text-xs text-slate-500">
                        {payment.paidAt ? formatDateBR(payment.paidAt) : formatDateBR(payment.dueDate)}
                      </span>
                    </div>
                    {payment.customerNotifiedPaidAt ? (
                      <p className="mt-2 text-sm font-medium text-amber-700">
                        Cliente informou que ja pagou e aguarda confirmacao administrativa.
                      </p>
                    ) : null}
                    {payment.notes ? <p className="mt-2 text-sm text-slate-500">{payment.notes}</p> : null}
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500">Nenhum pagamento registrado ainda.</p>
              )}
            </div>
          </Card>

          <Card>
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Registrar pagamento</p>
            <form className="mt-4 space-y-4" onSubmit={handlePaymentSubmit}>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-ink">Mes de referencia</label>
                  <input
                    className="app-input"
                    onChange={(event) => setReferenceMonth(event.target.value)}
                    placeholder="2026-03"
                    value={referenceMonth}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-ink">Valor</label>
                  <input
                    className="app-input"
                    min="0"
                    onChange={(event) => setAmount(event.target.value)}
                    step="0.01"
                    type="number"
                    value={amount}
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-ink">Status</label>
                  <select
                    className="app-select"
                    onChange={(event) =>
                      setPaymentStatus(
                        event.target.value as "pending" | "paid" | "overdue" | "canceled",
                      )
                    }
                    value={paymentStatus}
                  >
                    <option value="paid">Pago</option>
                    <option value="pending">Pendente</option>
                    <option value="overdue">Em atraso</option>
                    <option value="canceled">Cancelado</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-ink">Metodo de pagamento</label>
                  <input
                    className="app-input"
                    onChange={(event) => setPaymentMethod(event.target.value)}
                    value={paymentMethod}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-ink">Pago em</label>
                <input
                  className="app-input"
                  onChange={(event) => setPaidAt(event.target.value)}
                  type="datetime-local"
                  value={paidAt}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-ink">Observacoes</label>
                <textarea
                  className="app-textarea"
                  onChange={(event) => setPaymentNotes(event.target.value)}
                  value={paymentNotes}
                />
              </div>

              {createPaymentError ? (
                <p className="text-sm text-rose-600">{createPaymentError.message}</p>
              ) : null}

              <Button disabled={isCreatingPayment} type="submit">
                {isCreatingPayment ? "Salvando..." : "Registrar pagamento"}
              </Button>
            </form>
          </Card>
        </>
      ) : null}
    </section>
  );
}
