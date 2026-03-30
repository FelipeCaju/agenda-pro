import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { FullscreenState } from "@/components/ui/fullscreen-state";
import { useAuth } from "@/hooks/use-auth";
import { useOrganization } from "@/hooks/use-organization";

export function SubscriptionBlockedPage() {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { organization, subscriptionBlockReason } = useOrganization();

  const description =
    subscriptionBlockReason === "payment_overdue"
      ? `A empresa ${organization?.nomeEmpresa ?? "vinculada a esta conta"} esta com pagamento em atraso. Seus dados continuam preservados, mas o uso do sistema fica bloqueado ate a regularizacao.`
      : subscriptionBlockReason === "trial_expired"
        ? `O periodo de teste da empresa ${organization?.nomeEmpresa ?? "vinculada a esta conta"} terminou. Os dados continuam intactos e o acesso pode ser reativado ao ajustar a assinatura.`
        : subscriptionBlockReason === "subscription_canceled"
          ? `A assinatura da empresa ${organization?.nomeEmpresa ?? "vinculada a esta conta"} foi cancelada. Nada foi apagado, mas o uso do sistema esta bloqueado.`
        : `A empresa ${organization?.nomeEmpresa ?? "vinculada a esta conta"} esta com a assinatura em restricao. Seus dados continuam preservados enquanto o acesso fica bloqueado.`;

  async function handleBackToLogin() {
    await signOut();
    navigate("/login", { replace: true });
  }

  return (
    <FullscreenState
      eyebrow="Assinatura"
      title="Acesso temporariamente bloqueado"
      description={description}
      action={
        <Button className="w-full" onClick={() => void handleBackToLogin()}>
          Voltar ao login
        </Button>
      }
    />
  );
}
