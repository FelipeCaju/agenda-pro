import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MobilePageHeader } from "@/components/layout/mobile-page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FullscreenState } from "@/components/ui/fullscreen-state";
import { useBillingMutations } from "@/hooks/use-billing-mutations";
import { useBillingCurrentChargeQuery, useBillingOverviewQuery } from "@/hooks/use-billing-query";
import { formatDateBR } from "@/utils/date";
import { getSubscriptionStatusLabel } from "@/utils/billing";

function formatCurrencyFromCents(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(value ?? 0) / 100);
}

function normalizePixImageSrc(value: string | null | undefined) {
  const normalized = String(value ?? "").trim();

  if (!normalized) {
    return "";
  }

  if (
    normalized.startsWith("data:image/") ||
    normalized.startsWith("http://") ||
    normalized.startsWith("https://")
  ) {
    return normalized;
  }

  return `data:image/png;base64,${normalized}`;
}

async function copyText(value: string) {
  if (!value.trim()) {
    throw new Error("Nao existe codigo Pix disponivel para copiar.");
  }

  await navigator.clipboard.writeText(value);
}

export function PaymentPage() {
  const navigate = useNavigate();
  const [selectedMethod, setSelectedMethod] = useState<"credit_card" | "pix">("credit_card");
  const { data: overview, error, isError, isLoading } = useBillingOverviewQuery();
  const {
    data: currentCharge,
    error: currentChargeError,
    isError: isCurrentChargeError,
  } = useBillingCurrentChargeQuery();
  const {
    startCheckout,
    startCardCheckout,
    isStartingCheckout,
    isStartingCardCheckout,
    startCheckoutError,
    startCardCheckoutError,
  } = useBillingMutations();
  const [copyMessage, setCopyMessage] = useState("");

  useEffect(() => {
    if (currentCharge?.paymentMethod === "pix" && currentCharge?.pixQrCodeText) {
      setSelectedMethod("pix");
      return;
    }

    setSelectedMethod("credit_card");
  }, [currentCharge?.paymentMethod, currentCharge?.pixQrCodeText]);

  async function handleStartCheckout() {
    setCopyMessage("");
    await startCheckout();
  }

  async function handleCopyPix() {
    setCopyMessage("");

    try {
      await copyText(currentCharge?.pixQrCodeText ?? "");
      setCopyMessage("Codigo Pix copiado com sucesso.");
    } catch (copyError) {
      setCopyMessage(copyError instanceof Error ? copyError.message : "Nao foi possivel copiar o Pix.");
    }
  }

  async function handleStartCardCheckout() {
    setCopyMessage("");
    try {
      const session = await startCardCheckout();

      if (!session.checkoutUrl) {
        return;
      }

      window.location.assign(session.checkoutUrl);
    } catch {
      return;
    }
  }

  if (isLoading && !overview) {
    return (
      <FullscreenState
        eyebrow="Pagamento"
        title="Carregando cobranca"
        description="Estamos buscando a cobranca atual e os dados da assinatura."
      />
    );
  }

  if ((isError && !overview) || isCurrentChargeError) {
    return (
      <FullscreenState
        eyebrow="Pagamento"
        title="Nao foi possivel abrir o pagamento"
        description={error?.message ?? currentChargeError?.message ?? "Falha ao carregar billing."}
        action={
          <Button onClick={() => navigate("/meu-plano")} type="button">
            Voltar para meu plano
          </Button>
        }
      />
    );
  }

  const planName = overview?.plan?.name ?? "AgendaPro Mensal";
  const planPriceCents = currentCharge?.amountCents ?? overview?.plan?.priceCents ?? 2990;
  const planDescription =
    overview?.plan?.description ?? "Assinatura mensal para manter sua empresa ativa no AgendaPro.";
  const dueDateLabel = overview?.access.dueDate ? formatDateBR(overview.access.dueDate) : "Assim que a cobranca for gerada";
  const graceUntilLabel = overview?.access.graceUntil ? formatDateBR(overview.access.graceUntil) : null;
  const statusLabel = getSubscriptionStatusLabel(overview?.access.subscriptionStatus ?? null);
  const pixImageSrc = normalizePixImageSrc(currentCharge?.pixQrCodeImageUrl);

  return (
    <section className="space-y-4 pb-8 xl:space-y-5">
      <MobilePageHeader
        action={
          <Button onClick={() => navigate("/meu-plano")} type="button" variant="secondary">
            Voltar
          </Button>
        }
        subtitle="Plano mensal e regularizacao segura via Asaas"
        title="Pagamento"
      />

      <Card className="overflow-hidden border-0 bg-[linear-gradient(135deg,#0f172a_0%,#1e293b_48%,#0f766e_100%)] p-0 text-white shadow-[0_24px_60px_rgba(15,23,42,0.26)]">
        <div className="grid gap-6 px-5 py-6 sm:px-6 xl:grid-cols-[minmax(0,1.1fr)_340px] xl:items-start xl:px-8 xl:py-8">
          <div className="space-y-4">
            <div className="inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] uppercase tracking-[0.28em] text-white/80">
              Assinatura profissional
            </div>
            <div className="space-y-2">
              <h2 className="max-w-xl text-[2rem] font-semibold leading-tight tracking-[-0.04em] text-white sm:text-[2.5rem]">
                {planName}
              </h2>
              <p className="max-w-2xl text-sm leading-6 text-white/74 sm:text-base">
                {planDescription}
              </p>
            </div>

            <div className="flex flex-col gap-3 rounded-[28px] border border-white/12 bg-white/10 p-5 backdrop-blur sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-white/70">Valor do plano</p>
                <p className="mt-2 text-4xl font-semibold tracking-[-0.05em] text-white sm:text-5xl">
                  {formatCurrencyFromCents(planPriceCents)}
                </p>
                <p className="mt-2 text-sm text-emerald-100/90">Cobranca mensal recorrente</p>
              </div>
              <div className="rounded-[22px] bg-white/95 px-4 py-3 text-slate-900 shadow-soft">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Status atual</p>
                <p className="mt-1 text-lg font-semibold">{statusLabel}</p>
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1 xl:self-stretch">
            <div className="rounded-[24px] border border-white/12 bg-white/10 px-4 py-4 backdrop-blur">
              <p className="text-xs uppercase tracking-[0.18em] text-white/65">Vencimento</p>
              <p className="mt-2 text-lg font-semibold text-white">{dueDateLabel}</p>
            </div>
            <div className="rounded-[24px] border border-white/12 bg-white/10 px-4 py-4 backdrop-blur">
              <p className="text-xs uppercase tracking-[0.18em] text-white/65">Tolerancia</p>
              <p className="mt-2 text-lg font-semibold text-white">{graceUntilLabel ?? "Sem periodo extra"}</p>
            </div>
            <div className="rounded-[24px] border border-white/12 bg-white/10 px-4 py-4 backdrop-blur">
              <p className="text-xs uppercase tracking-[0.18em] text-white/65">Pagamento</p>
              <p className="mt-2 text-lg font-semibold text-white">Pix ou cartao com validacao por webhook</p>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 xl:grid-cols-[360px_minmax(0,1fr)] xl:items-start xl:gap-5">
        <Card className="space-y-4 border-slate-200 bg-[linear-gradient(180deg,rgba(248,250,252,0.96),rgba(255,255,255,1))] xl:sticky xl:top-6">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Como funciona</p>
            <h3 className="text-xl font-semibold tracking-[-0.03em] text-ink">Regularize em poucos passos</h3>
          </div>

          <div className="space-y-3">
            {[
              "1. Gere ou reaproveite a cobranca ativa do plano mensal.",
              "2. Escolha entre Pix imediato ou checkout hospedado com cartao.",
              "3. O Asaas confirma pelo webhook e o acesso volta automaticamente.",
            ].map((item) => (
              <div
                className="rounded-[22px] border border-slate-200 bg-white px-4 py-4 text-sm leading-6 text-slate-600 shadow-soft"
                key={item}
              >
                {item}
              </div>
            ))}
          </div>

          {!currentCharge ? (
            <div className="rounded-[24px] border border-emerald-100 bg-emerald-50/80 p-4">
              <p className="text-sm font-semibold text-emerald-900">Sua cobranca ainda nao foi preparada</p>
              <p className="mt-2 text-sm text-emerald-800">
                Gere agora a cobranca do plano mensal de {formatCurrencyFromCents(planPriceCents)} para abrir o pagamento.
              </p>
              <Button
                className="mt-4 w-full sm:w-auto"
                disabled={isStartingCheckout}
                onClick={() => void handleStartCheckout()}
                type="button"
              >
                {isStartingCheckout ? "Preparando pagamento..." : "Gerar pagamento agora"}
              </Button>
            </div>
          ) : (
            <div className="rounded-[24px] border border-slate-200 bg-slate-50/85 p-4">
              <p className="text-sm font-semibold text-ink">Cobranca pronta para pagamento</p>
              <p className="mt-2 text-sm text-slate-600">
                O plano mensal ja esta configurado com o valor de {formatCurrencyFromCents(planPriceCents)}.
              </p>
              {currentCharge.dueDate ? (
                <p className="mt-2 text-sm text-slate-600">
                  Vencimento atual: <strong className="text-ink">{formatDateBR(currentCharge.dueDate)}</strong>
                </p>
              ) : null}
            </div>
          )}

          {startCheckoutError ? <p className="text-sm text-rose-600">{startCheckoutError.message}</p> : null}
        </Card>

        <Card className="space-y-4 border-slate-200 bg-white">
          <div className="rounded-[22px] border border-slate-200 bg-slate-50/80 p-2">
            <div className="grid grid-cols-2 gap-2">
              <button
                className={`rounded-[18px] px-4 py-3 text-sm font-semibold transition ${
                  selectedMethod === "credit_card"
                    ? "bg-[#0f172a] text-white shadow-soft"
                    : "bg-white text-slate-600"
                }`}
                onClick={() => setSelectedMethod("credit_card")}
                type="button"
              >
                Cartao
              </button>
              <button
                className={`rounded-[18px] px-4 py-3 text-sm font-semibold transition ${
                  selectedMethod === "pix"
                    ? "bg-emerald-600 text-white shadow-soft"
                    : "bg-white text-slate-600"
                }`}
                onClick={() => setSelectedMethod("pix")}
                type="button"
              >
                Pix
              </button>
            </div>
          </div>

          {selectedMethod === "credit_card" ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Checkout hospedado</p>
                  <h3 className="mt-1 text-xl font-semibold tracking-[-0.03em] text-ink">Cartao recorrente</h3>
                </div>
                <div className="rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-sky-700">
                  Asaas
                </div>
              </div>

              <div className="rounded-[24px] border border-slate-200 bg-[linear-gradient(135deg,rgba(15,23,42,0.03),rgba(14,165,233,0.09))] p-4">
                <p className="text-sm font-semibold text-ink">Pague com cartao sem expor dados no AgendaPro</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Ao continuar, voce vai para um checkout seguro do Asaas. Numero do cartao, CVV e dados do titular ficam no gateway, nao no nosso backend.
                </p>
                <Button
                  className="mt-4 w-full sm:w-auto"
                  disabled={isStartingCardCheckout}
                  onClick={() => void handleStartCardCheckout()}
                  type="button"
                >
                  {isStartingCardCheckout ? "Abrindo checkout..." : "Pagar com cartao"}
                </Button>
                {startCardCheckoutError ? (
                  <p className="mt-3 text-sm text-rose-600">{startCardCheckoutError.message}</p>
                ) : null}
              </div>
            </div>
          ) : null}

          {selectedMethod === "pix" ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Pagamento instantaneo</p>
                  <h3 className="mt-1 text-xl font-semibold tracking-[-0.03em] text-ink">Pix</h3>
                </div>
                <div className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">
                  Seguro
                </div>
              </div>

              {currentCharge ? (
                <>
              <div className="flex flex-col items-center gap-4 rounded-[28px] border border-slate-200 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.10),rgba(255,255,255,1)_72%)] p-5 xl:flex-row xl:items-start xl:gap-5">
                {pixImageSrc ? (
                  <img
                    alt="QR Code Pix"
                    className="h-60 w-60 shrink-0 rounded-[26px] border border-slate-200 bg-white p-3 shadow-soft"
                    src={pixImageSrc}
                  />
                ) : (
                  <div className="flex h-60 w-60 shrink-0 items-center justify-center rounded-[26px] border border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
                    O QR Code Pix sera disponibilizado assim que a cobranca estiver pronta no gateway.
                  </div>
                )}

                <div className="w-full rounded-[24px] border border-slate-200 bg-white px-4 py-4 shadow-soft xl:min-h-[240px]">
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Codigo Pix</p>
                  <p className="mt-2 break-all text-sm font-semibold leading-6 text-ink">
                    {currentCharge.pixQrCodeText || "Ainda indisponivel"}
                  </p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {currentCharge.invoiceUrl ? (
                  <Button
                    className="w-full"
                    onClick={() => window.open(currentCharge.invoiceUrl ?? "", "_blank", "noopener,noreferrer")}
                    type="button"
                  >
                    Abrir cobranca no Asaas
                  </Button>
                ) : (
                  <Button className="w-full" disabled type="button">
                    Cobranca indisponivel
                  </Button>
                )}
                <Button className="w-full" onClick={() => void handleCopyPix()} type="button" variant="secondary">
                  Copiar codigo Pix
                </Button>
              </div>

              <div className="rounded-[22px] border border-slate-200 bg-slate-50/80 px-4 py-4 text-sm text-slate-600">
                <p className="font-semibold text-ink">Importante</p>
                <p className="mt-2 leading-6">
                  A liberacao acontece automaticamente depois da confirmacao do gateway. Nao depende de confirmacao manual no frontend.
                </p>
              </div>

              {copyMessage ? <p className="text-sm text-emerald-700">{copyMessage}</p> : null}
                </>
              ) : (
                <div className="rounded-[24px] border border-slate-200 bg-slate-50/80 p-4 text-sm text-slate-500">
                  Gere a cobranca do plano para visualizar o QR Code Pix e a fatura hospedada.
                </div>
              )}
            </div>
          ) : null}
        </Card>
      </div>
    </section>
  );
}
