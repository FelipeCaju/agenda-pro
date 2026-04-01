import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MobilePageHeader } from "@/components/layout/mobile-page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FullscreenState } from "@/components/ui/fullscreen-state";
import { useOrganizationMutations } from "@/hooks/use-organization-mutations";
import {
  useOrganizationPaymentsQuery,
  useOrganizationQuery,
} from "@/hooks/use-organization-query";
import { formatDateBR } from "@/utils/date";
import { buildPixQrUrl, copyPixKey } from "@/utils/pix";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function getTitle(status?: string | null) {
  if (status === "trial") return "Comprar sistema";
  if (status === "overdue" || status === "blocked") return "Regularizar assinatura";
  return "Pagamento do sistema";
}

function formatReferenceMonth(value?: string | null) {
  if (!value || !/^\d{4}-\d{2}$/.test(value)) {
    return "Mes atual";
  }

  const [year, month] = value.split("-");
  return new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric",
  }).format(new Date(Number(year), Number(month) - 1, 1));
}

export function PaymentPage() {
  const navigate = useNavigate();
  const {
    data: organization,
    error: organizationError,
    isError: isOrganizationError,
    isLoading: isLoadingOrganization,
  } = useOrganizationQuery();
  const { data: payments = [] } = useOrganizationPaymentsQuery();
  const { notifyPaymentPaid, isNotifyingPaymentPaid, notifyPaymentPaidError } =
    useOrganizationMutations();
  const [copyMessage, setCopyMessage] = useState("");
  const [paymentSignalMessage, setPaymentSignalMessage] = useState("");
  const latestPayment = payments[0] ?? null;
  const billingAmount = latestPayment?.amount ?? organization?.latestPaymentAmount ?? 0;
  const billingReferenceMonth = latestPayment?.referenceMonth ?? organization?.latestReferenceMonth ?? null;

  const qrCodeUrl = useMemo(() => buildPixQrUrl(organization?.pixKey ?? ""), [organization?.pixKey]);

  async function handleCopyPixKey() {
    setCopyMessage("");

    try {
      await copyPixKey(organization?.pixKey ?? "");
      setCopyMessage("Chave Pix copiada com sucesso.");
    } catch (error) {
      setCopyMessage(error instanceof Error ? error.message : "Nao foi possivel copiar a chave Pix.");
    }
  }

  async function handleNotifyPaymentPaid() {
    try {
      await notifyPaymentPaid({ paymentId: organization?.latestPaymentId ?? null });
      setPaymentSignalMessage(
        "Pagamento informado com sucesso. Aguarde enquanto processamos e validamos a liberacao do seu acesso.",
      );
    } catch {
      return;
    }
  }

  if (isLoadingOrganization && !organization) {
    return (
      <FullscreenState
        eyebrow="Pagamento"
        title="Carregando dados de cobranca"
        description="Estamos buscando a chave Pix e o status da assinatura."
      />
    );
  }

  if (isOrganizationError || !organization) {
    return (
      <FullscreenState
        eyebrow="Pagamento"
        title="Nao foi possivel abrir a cobranca"
        description={organizationError?.message ?? "Organizacao nao encontrada."}
        action={
          <Button onClick={() => navigate("/gestao")} type="button">
            Voltar para gestao
          </Button>
        }
      />
    );
  }

  return (
    <section className="space-y-4 pb-8">
      <MobilePageHeader
        action={
          <Button onClick={() => navigate("/gestao")} type="button" variant="secondary">
            Voltar
          </Button>
        }
        subtitle="Pix com QR Code e copia da chave"
        title={getTitle(organization.subscriptionStatus)}
      />

      <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <Card className="space-y-4">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Resumo</p>
          <div className="space-y-2 text-sm text-slate-600">
            <p>
              Empresa: <strong className="text-ink">{organization.nomeEmpresa}</strong>
            </p>
            <p>
              Valor da mensalidade: <strong className="text-ink">{formatCurrency(billingAmount)}</strong>
            </p>
            <p>
              Referente a: <strong className="text-ink">{formatReferenceMonth(billingReferenceMonth)}</strong>
            </p>
            <p>
              Status atual: <strong className="text-ink">{organization.subscriptionStatus}</strong>
            </p>
            {organization.trialEnd ? (
              <p>
                Trial ate: <strong className="text-ink">{formatDateBR(organization.trialEnd)}</strong>
              </p>
            ) : null}
            {organization.dueDate ? (
              <p>
                Vencimento: <strong className="text-ink">{formatDateBR(organization.dueDate)}</strong>
              </p>
            ) : null}
            {billingAmount > 0 ? (
              <p>
                Cobranca atual: <strong className="text-ink">{formatCurrency(billingAmount)}</strong>
              </p>
            ) : null}
          </div>

          <div className="rounded-[24px] border border-slate-200 bg-slate-50/80 p-4">
            <p className="text-sm font-semibold text-ink">Como pagar</p>
            <p className="mt-2 text-sm text-slate-500">
              Escaneie o QR Code no app do banco ou copie o codigo Pix para colar manualmente no seu banco.
            </p>
          </div>
        </Card>

        <Card className="space-y-4">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Pix</p>
          <div className="flex flex-col items-center gap-4 rounded-[28px] border border-slate-200 bg-slate-50/80 p-5">
            {qrCodeUrl ? (
              <img
                alt="QR Code Pix"
                className="h-56 w-56 rounded-[24px] border border-slate-200 bg-white p-3 shadow-soft"
                src={qrCodeUrl}
              />
            ) : (
              <div className="flex h-56 w-56 items-center justify-center rounded-[24px] border border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
                Nenhuma chave Pix cadastrada no gestor.
              </div>
            )}

            <div className="w-full rounded-[24px] bg-white px-4 py-4 shadow-soft">
              <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Chave Pix</p>
              <p className="mt-2 break-all text-sm font-semibold text-ink">
                {organization.pixKey || "Nao informada"}
              </p>
            </div>

            <div className="flex w-full flex-col gap-3 sm:flex-row">
              <Button className="w-full" onClick={() => void handleCopyPixKey()} type="button">
                Copiar codigo Pix
              </Button>
              <Button
                className="w-full"
                disabled={
                  isNotifyingPaymentPaid ||
                  Boolean(latestPayment?.customerNotifiedPaidAt)
                }
                onClick={() => void handleNotifyPaymentPaid()}
                type="button"
                variant="secondary"
              >
                {latestPayment?.customerNotifiedPaidAt
                  ? "Administrador ja avisado"
                  : isNotifyingPaymentPaid
                    ? "Processando aviso..."
                    : "Confirmar que paguei"}
              </Button>
            </div>

            {copyMessage ? <p className="text-sm text-emerald-700">{copyMessage}</p> : null}
            {paymentSignalMessage ? (
              <p className="text-sm text-emerald-700">{paymentSignalMessage}</p>
            ) : null}
            {notifyPaymentPaidError ? (
              <p className="text-sm text-rose-600">{notifyPaymentPaidError.message}</p>
            ) : null}
          </div>
        </Card>
      </div>
    </section>
  );
}
