import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FullscreenState } from "@/components/ui/fullscreen-state";
import { useAuth } from "@/hooks/use-auth";
import { useOrganizationMutations } from "@/hooks/use-organization-mutations";
import { useOrganizationPaymentsQuery, useOrganizationQuery } from "@/hooks/use-organization-query";
import { useOrganization } from "@/hooks/use-organization";

export function SubscriptionBlockedPage() {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { organization: sessionOrganization, subscriptionBlockReason } = useOrganization();
  const { data: organization } = useOrganizationQuery();
  const { data: payments = [] } = useOrganizationPaymentsQuery();
  const { notifyPaymentPaid, isNotifyingPaymentPaid, notifyPaymentPaidError } = useOrganizationMutations();
  const [successMessage, setSuccessMessage] = useState("");
  const latestPayment = payments[0] ?? null;

  const description =
    subscriptionBlockReason === "payment_overdue"
      ? `A empresa ${organization?.nomeEmpresa ?? sessionOrganization?.nomeEmpresa ?? "vinculada a esta conta"} esta com pagamento em atraso. Seus dados continuam preservados, mas o uso do sistema fica bloqueado ate a regularizacao.`
      : subscriptionBlockReason === "trial_expired"
        ? `O periodo de teste da empresa ${organization?.nomeEmpresa ?? sessionOrganization?.nomeEmpresa ?? "vinculada a esta conta"} terminou. Os dados continuam intactos e o acesso pode ser reativado ao ajustar a assinatura.`
        : subscriptionBlockReason === "subscription_canceled"
          ? `A assinatura da empresa ${organization?.nomeEmpresa ?? sessionOrganization?.nomeEmpresa ?? "vinculada a esta conta"} foi cancelada. Nada foi apagado, mas o uso do sistema esta bloqueado.`
          : `A empresa ${organization?.nomeEmpresa ?? sessionOrganization?.nomeEmpresa ?? "vinculada a esta conta"} esta com a assinatura em restricao. Seus dados continuam preservados enquanto o acesso fica bloqueado.`;

  async function handleNotifyPaymentPaid() {
    try {
      await notifyPaymentPaid({ paymentId: organization?.latestPaymentId ?? null });
      setSuccessMessage(
        "Pagamento informado com sucesso. Aguarde enquanto processamos e validamos a liberacao do seu acesso.",
      );
    } catch {
      return;
    }
  }

  async function handleBackToLogin() {
    await signOut();
    navigate("/login", { replace: true });
  }

  return (
    <FullscreenState
      eyebrow="Assinatura"
      title="Acesso temporariamente bloqueado"
      description={[
        description,
        organization?.graceUntil ? `Folga considerada ate ${organization.graceUntil}.` : null,
        organization?.pixKey ? `Chave Pix: ${organization.pixKey}` : null,
        successMessage || null,
        notifyPaymentPaidError?.message ?? null,
      ]
        .filter(Boolean)
        .join(" ")}
      action={
        <div className="flex w-full flex-col gap-3">
          {organization?.pixKey ? (
            <Button className="w-full" onClick={() => navigate("/pagamento")}>
              Realizar pagamento
            </Button>
          ) : null}
          {organization?.paymentNoticeVisible && latestPayment?.status !== "paid" ? (
            <Button
              className="w-full"
              disabled={
                isNotifyingPaymentPaid ||
                Boolean(latestPayment?.customerNotifiedPaidAt)
              }
              onClick={() => void handleNotifyPaymentPaid()}
              variant="secondary"
            >
              {latestPayment?.customerNotifiedPaidAt
                ? "Administrador ja avisado"
                : isNotifyingPaymentPaid
                  ? "Enviando aviso..."
                  : "Confirmar que ja paguei"}
            </Button>
          ) : null}
          <Button className="w-full" onClick={() => void handleBackToLogin()}>
            Voltar ao login
          </Button>
        </div>
      }
    />
  );
}
