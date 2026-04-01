import { FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MobilePageHeader } from "@/components/layout/mobile-page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PasswordField } from "@/components/ui/password-field";
import { useAdminPlatformSettingsQuery } from "@/hooks/use-admin-platform-settings-query";
import { useAdminMutations } from "@/hooks/use-admin-mutations";
import { useAdminOrganizationsQuery } from "@/hooks/use-admin-organizations-query";

function getStatusPagamentoLabel(status: string) {
  if (status === "paid") return "Pago";
  if (status === "overdue") return "Em atraso";
  if (status === "pending") return "Pendente";
  if (status === "canceled") return "Cancelado";
  return "Sem historico";
}

function getStatusAssinaturaLabel(status: string) {
  if (status === "active") return "Ativa";
  if (status === "overdue") return "Em atraso";
  if (status === "blocked") return "Bloqueada";
  if (status === "trial") return "Em teste";
  if (status === "canceled") return "Cancelada";
  return status;
}

function getPlanoLabel(plan: string) {
  return plan === "trial" ? "Trial" : "Pro";
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function formatCurrencyInput(value: string) {
  const digits = value.replace(/\D/g, "");

  if (!digits) {
    return "";
  }

  const amount = Number(digits) / 100;
  return amount.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function parseCurrencyInput(value: string) {
  if (!value.trim()) {
    return undefined;
  }

  const normalized = value.replace(/\./g, "").replace(",", ".");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : NaN;
}

export function PlatformAdminPage() {
  const navigate = useNavigate();
  const { data = [], error, isLoading, isError } = useAdminOrganizationsQuery();
  const {
    createOrganization,
    createOrganizationError,
    isCreatingOrganization,
    isUpdatingPlatformSettings,
    updatePlatformSettings,
    updatePlatformSettingsError,
  } = useAdminMutations();
  const { data: platformSettings } = useAdminPlatformSettingsQuery();
  const [nomeEmpresa, setNomeEmpresa] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [emailResponsavel, setEmailResponsavel] = useState("");
  const [initialPassword, setInitialPassword] = useState("");
  const [telefone, setTelefone] = useState("");
  const [monthlyAmount, setMonthlyAmount] = useState("149,90");
  const [subscriptionPlan, setSubscriptionPlan] = useState<"trial" | "pro">("trial");
  const [trialDays, setTrialDays] = useState("5");
  const [successMessage, setSuccessMessage] = useState("");
  const [pixKey, setPixKey] = useState("");
  const [adminWhatsappNumber, setAdminWhatsappNumber] = useState("");
  const [paymentGraceDays, setPaymentGraceDays] = useState("5");
  const [paymentAlertDays, setPaymentAlertDays] = useState("5");

  useEffect(() => {
    if (!platformSettings) {
      return;
    }

    setPixKey(platformSettings.pixKey ?? "");
    setAdminWhatsappNumber(platformSettings.adminWhatsappNumber ?? "");
    setPaymentGraceDays(String(platformSettings.paymentGraceDays ?? 5));
    setPaymentAlertDays(String(platformSettings.paymentAlertDays ?? 5));
  }, [platformSettings]);

  async function handlePlatformSettingsSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      await updatePlatformSettings({
        pixKey,
        adminWhatsappNumber,
        paymentGraceDays: Number(paymentGraceDays),
        paymentAlertDays: Number(paymentAlertDays),
      });
      setSuccessMessage("Configuracoes financeiras da plataforma atualizadas com sucesso.");
    } catch {
      return;
    }
  }

  async function handleCreateOrganization(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      const created = await createOrganization({
        nomeEmpresa,
        ownerName,
        emailResponsavel,
        initialPassword,
        telefone,
        monthlyAmount: parseCurrencyInput(monthlyAmount) ?? 0,
        subscriptionPlan,
        trialDays: Number(trialDays),
      });

      setSuccessMessage("Empresa criada com sucesso.");
      setNomeEmpresa("");
      setOwnerName("");
      setEmailResponsavel("");
      setInitialPassword("");
      setTelefone("");
      setMonthlyAmount("149,90");
      setSubscriptionPlan("trial");
      setTrialDays("5");
      navigate(`/admin/organizacoes/${created.organization.id}`);
    } catch {
      return;
    }
  }

  return (
    <section className="space-y-4">
      <MobilePageHeader subtitle="Empresas, mensalidade e pagamento do mes" title="Empresas" />

      <Card>
        <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Financeiro da plataforma</p>
        <h3 className="mt-2 text-lg font-semibold text-ink">Pix e tolerancia de pagamento</h3>

        <form className="mt-4 space-y-4" onSubmit={handlePlatformSettingsSubmit}>
          <div className="space-y-2">
            <label className="text-sm font-medium text-ink">Chave Pix</label>
            <input className="app-input" onChange={(event) => setPixKey(event.target.value)} value={pixKey} />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-ink">WhatsApp do admin</label>
            <input
              className="app-input"
              onChange={(event) => setAdminWhatsappNumber(event.target.value)}
              placeholder="5511999999999"
              value={adminWhatsappNumber}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-ink">Dias de folga apos o vencimento</label>
              <input
                className="app-input"
                min="0"
                onChange={(event) => setPaymentGraceDays(event.target.value)}
                step="1"
                type="number"
                value={paymentGraceDays}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-ink">Dias para antecipar alerta</label>
              <input
                className="app-input"
                min="0"
                onChange={(event) => setPaymentAlertDays(event.target.value)}
                step="1"
                type="number"
                value={paymentAlertDays}
              />
            </div>
          </div>

          <div className="rounded-[22px] border border-slate-200 bg-slate-50/80 px-4 py-4 text-sm text-slate-600">
            <p>
              Exemplo: vencimento no dia <strong>5</strong> com folga de <strong>{paymentGraceDays || "0"}</strong>{" "}
              dia(s) bloqueia somente depois do dia <strong>{5 + Number(paymentGraceDays || 0)}</strong>.
            </p>
            <p className="mt-2">
              Quando o cliente confirmar o pagamento, este WhatsApp recebe o aviso para voce validar e liberar o
              acesso manualmente.
            </p>
          </div>

          {updatePlatformSettingsError ? (
            <p className="text-sm text-rose-600">{updatePlatformSettingsError.message}</p>
          ) : null}

          <Button disabled={isUpdatingPlatformSettings} type="submit">
            {isUpdatingPlatformSettings ? "Salvando..." : "Salvar configuracoes financeiras"}
          </Button>
        </form>
      </Card>

      <Card>
        <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Nova empresa</p>
        <h3 className="mt-2 text-lg font-semibold text-ink">Cadastrar cliente SaaS</h3>

        <form className="mt-4 space-y-4" onSubmit={handleCreateOrganization}>
          <div className="space-y-2">
            <label className="text-sm font-medium text-ink">Nome da empresa</label>
            <input className="app-input" onChange={(event) => setNomeEmpresa(event.target.value)} value={nomeEmpresa} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-ink">Responsavel</label>
              <input className="app-input" onChange={(event) => setOwnerName(event.target.value)} value={ownerName} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-ink">Email de acesso</label>
              <input
                className="app-input"
                onChange={(event) => setEmailResponsavel(event.target.value)}
                type="email"
                value={emailResponsavel}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-ink">Senha inicial</label>
            <PasswordField
              inputClassName="app-input pr-14"
              onChange={(event) => setInitialPassword(event.target.value)}
              placeholder="Minimo de 8 caracteres"
              value={initialPassword}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-ink">Telefone</label>
              <input className="app-input" onChange={(event) => setTelefone(event.target.value)} value={telefone} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-ink">Mensalidade</label>
              <input
                className="app-input"
                inputMode="numeric"
                onChange={(event) => setMonthlyAmount(formatCurrencyInput(event.target.value))}
                placeholder="0,00"
                type="text"
                value={monthlyAmount}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
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
            <div className="space-y-2">
              <label className="text-sm font-medium text-ink">Dias de trial</label>
              <input
                className="app-input"
                disabled={subscriptionPlan !== "trial"}
                min="1"
                onChange={(event) => setTrialDays(event.target.value)}
                step="1"
                type="number"
                value={trialDays}
              />
            </div>
          </div>

          <div className="rounded-[22px] border border-slate-200 bg-slate-50/80 px-4 py-4 text-sm text-slate-600">
            {subscriptionPlan === "trial" ? (
              <p>
                Esta empresa entra em <strong>Trial</strong> e pode usar o sistema por{" "}
                <strong>{trialDays || "0"} dia(s)</strong>. Ao vencer, o acesso fica bloqueado ate o pagamento.
              </p>
            ) : (
              <p>
                Esta empresa entra no plano <strong>Pro</strong>. O acesso nasce liberado e o controle financeiro
                continua pelo historico de cobranca.
              </p>
            )}
          </div>

          {successMessage ? <p className="text-sm text-emerald-700">{successMessage}</p> : null}
          {createOrganizationError ? (
            <p className="text-sm text-rose-600">{createOrganizationError.message}</p>
          ) : null}

          <Button disabled={isCreatingOrganization} type="submit">
            {isCreatingOrganization ? "Criando..." : "Cadastrar empresa"}
          </Button>
        </form>
      </Card>

      {isLoading ? (
        <Card>
          <p className="text-sm text-slate-500">Carregando empresas...</p>
        </Card>
      ) : null}

      {isError ? (
        <Card className="app-message-error">
          <p className="text-sm font-medium">{error.message}</p>
        </Card>
      ) : null}

      {!isLoading && !isError ? (
        <div className="space-y-3">
          {data.length ? (
            data.map((organization) => (
              <button
                className="block w-full text-left"
                key={organization.id}
                onClick={() => navigate(`/admin/organizacoes/${organization.id}`)}
                type="button"
              >
                <Card className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="truncate text-lg font-semibold text-ink">
                        {organization.nomeEmpresa}
                      </h2>
                      <p className="truncate text-sm text-slate-500">
                        {organization.emailResponsavel}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        organization.isBlocked
                          ? "bg-rose-50 text-rose-700"
                          : "bg-emerald-50 text-emerald-700"
                      }`}
                    >
                      {organization.isBlocked ? "Bloqueada" : "Liberada"}
                    </span>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-4">
                    <div className="rounded-2xl bg-slate-50 px-3 py-3">
                      <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
                        Assinatura
                      </p>
                      <p className="mt-2 text-sm font-semibold text-ink">
                        {getStatusAssinaturaLabel(organization.subscriptionStatus)}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 px-3 py-3">
                      <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
                        Pagamento
                      </p>
                      <p className="mt-2 text-sm font-semibold text-ink">
                        {getStatusPagamentoLabel(organization.latestPaymentStatus ?? "")}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 px-3 py-3">
                      <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Plano</p>
                      <p className="mt-2 text-sm font-semibold text-ink">
                        {getPlanoLabel(organization.subscriptionPlan)}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 px-3 py-3">
                      <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Mensalidade</p>
                      <p className="mt-2 text-sm font-semibold text-ink">
                        {formatCurrency(organization.monthlyAmount)}
                      </p>
                    </div>
                  </div>
                </Card>
              </button>
            ))
          ) : (
            <Card>
              <p className="text-sm text-slate-500">Nenhuma empresa cadastrada ainda.</p>
            </Card>
          )}
        </div>
      ) : null}
    </section>
  );
}
