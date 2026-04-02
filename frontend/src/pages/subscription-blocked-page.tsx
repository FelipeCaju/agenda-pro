import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FullscreenState } from "@/components/ui/fullscreen-state";
import { useAuth } from "@/hooks/use-auth";
import { useBillingOverviewQuery } from "@/hooks/use-billing-query";
import { useOrganization } from "@/hooks/use-organization";
import { getSubscriptionStatusLabel } from "@/utils/billing";
import { formatDateBR } from "@/utils/date";

function formatCurrencyFromCents(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(value ?? 0) / 100);
}

export function SubscriptionBlockedPage() {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { organization } = useOrganization();
  const { data: overview, error, isError, isLoading } = useBillingOverviewQuery();

  async function handleBackToLogin() {
    await signOut();
    navigate("/login", { replace: true });
  }

  if (isLoading && !overview) {
    return (
      <FullscreenState
        eyebrow="Assinatura"
        title="Carregando status da assinatura"
        description="Estamos buscando os detalhes do billing para regularizacao."
      />
    );
  }

  if (isError || !overview) {
    return (
      <FullscreenState
        eyebrow="Assinatura"
        title="Nao foi possivel carregar o billing"
        description={error?.message ?? "Falha ao carregar a assinatura."}
        action={
          <Button className="w-full" onClick={() => void handleBackToLogin()}>
            Voltar ao login
          </Button>
        }
      />
    );
  }

  const companyName = organization?.nomeEmpresa ?? "sua empresa";
  const blockTitle =
    overview.access.blockReason === "payment_required"
      ? "Ative sua assinatura para continuar"
      : overview.access.blockReason === "payment_overdue"
        ? "Sua empresa entrou em restricao por atraso"
        : overview.access.blockReason === "subscription_cancelled"
          ? "Sua assinatura foi cancelada"
          : "Seu acesso esta temporariamente restrito";
  const description =
    overview.access.blockReason === "payment_required"
      ? `A empresa ${companyName} ainda nao confirmou o primeiro pagamento do plano. Assim que a cobranca for paga e validada pelo gateway, o acesso volta automaticamente.`
      : overview.access.blockReason === "payment_overdue"
        ? `A empresa ${companyName} esta com pagamento em atraso. Seus dados continuam preservados, mas o uso do AgendaPro ficou limitado ate a regularizacao.`
        : overview.access.blockReason === "subscription_cancelled"
          ? `A assinatura da empresa ${companyName} foi cancelada. Nenhum dado foi apagado, mas a organizacao permanece em modo restrito.`
          : `A assinatura da empresa ${companyName} esta em restricao no momento.`;

  return (
    <section className="space-y-4 pb-8">
      <Card className="overflow-hidden border-0 bg-[linear-gradient(145deg,#3f0d12_0%,#7f1d1d_36%,#111827_100%)] p-0 text-white shadow-[0_24px_60px_rgba(17,24,39,0.30)]">
        <div className="grid gap-6 px-5 py-6 sm:px-6 xl:grid-cols-[1.08fr_0.92fr] xl:px-8 xl:py-8">
          <div className="space-y-4">
            <div className="inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] uppercase tracking-[0.28em] text-white/80">
              Acesso restrito
            </div>
            <div className="space-y-2">
              <h1 className="max-w-2xl text-[2rem] font-semibold leading-tight tracking-[-0.04em] text-white sm:text-[2.7rem]">
                {blockTitle}
              </h1>
              <p className="max-w-2xl text-sm leading-6 text-white/78 sm:text-base">{description}</p>
            </div>

            <div className="rounded-[28px] border border-white/12 bg-white/10 p-5 backdrop-blur">
              <p className="text-xs uppercase tracking-[0.18em] text-white/70">Plano para regularizacao</p>
              <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-3xl font-semibold tracking-[-0.04em] text-white sm:text-4xl">
                    {overview.plan?.name ?? "AgendaPro Mensal"}
                  </p>
                  <p className="mt-2 text-sm text-white/72">
                    Pagamento mensal com confirmacao automatica por webhook.
                  </p>
                </div>
                <div className="rounded-[22px] bg-white/95 px-4 py-3 text-slate-900 shadow-soft">
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Valor</p>
                  <p className="mt-1 text-2xl font-semibold">
                    {formatCurrencyFromCents(
                      overview.currentCharge?.amountCents ?? overview.plan?.priceCents ?? 2990,
                    )}
                  </p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-3">
                <Button
                  className="border-0 bg-[linear-gradient(135deg,#f8d7a7_0%,#e8b574_100%)] px-6 text-sm font-semibold text-[#5b2715] shadow-[0_14px_30px_rgba(91,39,21,0.20)] transition hover:brightness-[1.03]"
                  onClick={() => navigate("/pagamento")}
                  type="button"
                >
                  Ir para pagamento
                </Button>
                <Button
                  className="border border-white/20 bg-white/12 px-5 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(17,24,39,0.18)] hover:bg-white/18"
                  onClick={() => navigate("/meu-plano")}
                  type="button"
                >
                  Ver meu plano
                </Button>
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
            <div className="rounded-[24px] border border-white/12 bg-white/10 px-4 py-4 backdrop-blur">
              <p className="text-xs uppercase tracking-[0.18em] text-white/65">Status</p>
              <p className="mt-2 text-lg font-semibold text-white">
                {getSubscriptionStatusLabel(overview.access.subscriptionStatus)}
              </p>
            </div>
            <div className="rounded-[24px] border border-white/12 bg-white/10 px-4 py-4 backdrop-blur">
              <p className="text-xs uppercase tracking-[0.18em] text-white/65">Vencimento</p>
              <p className="mt-2 text-lg font-semibold text-white">
                {overview.access.dueDate ? formatDateBR(overview.access.dueDate) : "Assim que gerar a cobranca"}
              </p>
            </div>
            <div className="rounded-[24px] border border-white/12 bg-white/10 px-4 py-4 backdrop-blur">
              <p className="text-xs uppercase tracking-[0.18em] text-white/65">Tolerancia</p>
              <p className="mt-2 text-lg font-semibold text-white">
                {overview.access.graceUntil ? formatDateBR(overview.access.graceUntil) : "Sem periodo extra"}
              </p>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 xl:grid-cols-[0.92fr_1.08fr]">
        <Card className="space-y-4 border-slate-200 bg-[linear-gradient(180deg,rgba(248,250,252,0.96),rgba(255,255,255,1))]">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">O que acontece agora</p>
            <h2 className="text-xl font-semibold tracking-[-0.03em] text-ink">Modo leitura com regularizacao</h2>
          </div>

          <div className="space-y-3">
            {[
              "Seus dados continuam preservados e a empresa nao perde historico.",
              "A liberacao volta automaticamente depois da confirmacao do pagamento pelo gateway.",
              "A tela de pagamento mostra o valor do plano, QR Code Pix e a fatura hospedada.",
            ].map((item) => (
              <div
                className="rounded-[22px] border border-slate-200 bg-white px-4 py-4 text-sm leading-6 text-slate-600 shadow-soft"
                key={item}
              >
                {item}
              </div>
            ))}
          </div>
        </Card>

        <Card className="space-y-4 border-slate-200 bg-white">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Regularizar agora</p>
            <h2 className="text-xl font-semibold tracking-[-0.03em] text-ink">Acoes rapidas</h2>
            <p className="text-sm leading-6 text-slate-600">
              Siga para a tela de pagamento para quitar o plano mensal e voltar a usar o sistema normalmente.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Button className="w-full" onClick={() => navigate("/faturas")} variant="secondary">
              Ver faturas
            </Button>
            <Button className="w-full" onClick={() => void handleBackToLogin()} variant="secondary">
              Voltar ao login
            </Button>
          </div>

          <div className="rounded-[22px] border border-amber-100 bg-amber-50/80 px-4 py-4 text-sm text-amber-800">
            A tela de pagamento e o caminho padrao para regularizacao quando a conta estiver bloqueada.
          </div>
        </Card>
      </div>
    </section>
  );
}
