import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { FullscreenState } from "@/components/ui/fullscreen-state";
import { useAuth } from "@/hooks/use-auth";
import { useOrganization } from "@/hooks/use-organization";

export function SubscriptionBlockedPage() {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { organization } = useOrganization();
  const companyName = organization?.nomeEmpresa ?? "sua empresa";

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      navigate("/pagamento", { replace: true, state: { fromBlocked: true } });
    }, 120);

    return () => window.clearTimeout(timeoutId);
  }, [navigate]);

  async function handleBackToLogin() {
    await signOut();
    navigate("/login", { replace: true });
  }

  return (
    <FullscreenState
      eyebrow="Assinatura"
      title="Indo para o pagamento"
      description={`A conta de ${companyName} esta em modo restrito. Vamos abrir a tela de pagamento para voce escolher Pix ou cartao.`}
      action={
        <div className="flex w-full flex-col gap-3 sm:flex-row">
          <Button className="w-full" onClick={() => navigate("/pagamento", { replace: true })} type="button">
            Abrir pagamento agora
          </Button>
          <Button className="w-full" onClick={() => void handleBackToLogin()} type="button" variant="secondary">
            Voltar ao login
          </Button>
        </div>
      }
    />
  );
}
