import { Navigate, Outlet } from "react-router-dom";
import { FullscreenState } from "@/components/ui/fullscreen-state";
import { useAuth } from "@/hooks/use-auth";
import { getPostAuthRedirect } from "@/utils/auth";

export function PublicRoute() {
  const auth = useAuth();

  if (auth.isLoading) {
    return (
      <FullscreenState
        eyebrow="AgendaPro"
        title="Preparando acesso"
        description="Estamos validando sua sessao para abrir a tela certa sem tela branca."
      />
    );
  }

  if (auth.isAuthenticated) {
    return (
      <Navigate
        replace
        to={getPostAuthRedirect({
          token: "active",
          scope: auth.isPlatformAdmin ? "platform" : "organization",
          user: auth.user!,
          organization: auth.organization,
          access: {
            isBlocked: auth.isSubscriptionBlocked,
            canAccess: !auth.isSubscriptionBlocked,
            needsOnboarding: auth.needsOnboarding,
            blockReason: auth.subscriptionBlockReason,
            subscriptionStatus: auth.organization?.subscriptionStatus ?? null,
            isTrialValid:
              auth.organization?.subscriptionStatus === "trial" && !auth.isSubscriptionBlocked,
          },
        })}
      />
    );
  }

  if (auth.status === "expired") {
    return <Outlet />;
  }

  return <Outlet />;
}
