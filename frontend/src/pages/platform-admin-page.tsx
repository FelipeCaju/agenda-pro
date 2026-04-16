import { FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MobilePageHeader } from "@/components/layout/mobile-page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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

export function PlatformAdminPage() {
  const navigate = useNavigate();
  const { data = [], error, isLoading, isError } = useAdminOrganizationsQuery();
  const {
    isUpdatingPlatformSettings,
    updatePlatformSettings,
    updatePlatformSettingsError,
  } = useAdminMutations();
  const { data: platformSettings } = useAdminPlatformSettingsQuery();
  const [successMessage, setSuccessMessage] = useState("");
  const [pixKey, setPixKey] = useState("");
  const [adminWhatsappNumber, setAdminWhatsappNumber] = useState("");
  const [defaultTrialDays, setDefaultTrialDays] = useState("5");
  const [paymentGraceDays, setPaymentGraceDays] = useState("5");
  const [paymentAlertDays, setPaymentAlertDays] = useState("5");

  useEffect(() => {
    if (!platformSettings) {
      return;
    }

    setPixKey(platformSettings.pixKey ?? "");
    setAdminWhatsappNumber(platformSettings.adminWhatsappNumber ?? "");
    setDefaultTrialDays(String(platformSettings.defaultTrialDays ?? 5));
    setPaymentGraceDays(String(platformSettings.paymentGraceDays ?? 5));
    setPaymentAlertDays(String(platformSettings.paymentAlertDays ?? 5));
  }, [platformSettings]);

  async function handlePlatformSettingsSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      await updatePlatformSettings({
        pixKey,
        adminWhatsappNumber,
        defaultTrialDays: Number(defaultTrialDays),
        paymentGraceDays: Number(paymentGraceDays),
        paymentAlertDays: Number(paymentAlertDays),
      });
      setSuccessMessage("Configuracoes da plataforma atualizadas com sucesso.");
    } catch {
      return;
    }
  }

  return (
    <section className="space-y-4">
      <MobilePageHeader subtitle="Empresas, mensalidade e pagamento do mes" title="Empresas" />

      <Card>
        <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Plataforma</p>
        <h3 className="mt-2 text-lg font-semibold text-ink">Pix, trial e tolerancia de pagamento</h3>

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

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <label className="text-sm font-medium text-ink">Dias padrao de trial</label>
              <input
                className="app-input"
                min="1"
                onChange={(event) => setDefaultTrialDays(event.target.value)}
                step="1"
                type="number"
                value={defaultTrialDays}
              />
            </div>
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
              Novos cadastros entram em <strong>trial</strong> por <strong>{defaultTrialDays || "0"}</strong> dia(s).
            </p>
            <p className="mt-2">
              Exemplo: vencimento no dia <strong>5</strong> com folga de <strong>{paymentGraceDays || "0"}</strong>{" "}
              dia(s) bloqueia somente depois do dia <strong>{5 + Number(paymentGraceDays || 0)}</strong>.
            </p>
            <p className="mt-2">
              Quando o cliente confirmar o pagamento, este WhatsApp recebe o aviso para voce validar e liberar o
              acesso manualmente.
            </p>
          </div>

          {successMessage ? <p className="text-sm text-emerald-700">{successMessage}</p> : null}
          {updatePlatformSettingsError ? (
            <p className="text-sm text-rose-600">{updatePlatformSettingsError.message}</p>
          ) : null}

          <Button disabled={isUpdatingPlatformSettings} type="submit">
            {isUpdatingPlatformSettings ? "Salvando..." : "Salvar configuracoes"}
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
