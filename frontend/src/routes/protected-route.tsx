import { Navigate, Outlet, useLocation } from "react-router-dom";
import { FullscreenState } from "@/components/ui/fullscreen-state";
import { useAuth } from "@/hooks/use-auth";

type ProtectedRouteProps = {
  allowBlocked?: boolean;
  allowOnboarding?: boolean;
  allowActiveAccess?: boolean;
};

export function ProtectedRoute({
  allowBlocked = false,
  allowOnboarding = false,
  allowActiveAccess = false,
}: ProtectedRouteProps) {
  const location = useLocation();
  const {
    error,
    isAuthenticated,
    isLoading,
    isPlatformAdmin,
    isSubscriptionBlocked,
    needsOnboarding,
  } = useAuth();

  if (isLoading) {
    return (
      <FullscreenState
        eyebrow="Sessao"
        title="Carregando seu acesso"
        description="Estamos recuperando sua sessao e validando sua empresa sem travar a aplicacao."
      />
    );
  }

  if (!isAuthenticated) {
    return <Navigate replace state={{ from: location.pathname }} to="/login" />;
  }

  if (isPlatformAdmin) {
    return <Navigate replace to="/admin" />;
  }

  if (needsOnboarding && !allowOnboarding) {
    return <Navigate replace to="/onboarding" />;
  }

  if (!needsOnboarding && allowOnboarding) {
    return <Navigate replace to={isSubscriptionBlocked ? "/assinatura-bloqueada" : "/"} />;
  }

  if (isSubscriptionBlocked && !allowBlocked) {
    return <Navigate replace to="/assinatura-bloqueada" />;
  }

  if (!isSubscriptionBlocked && allowBlocked && !allowOnboarding && !allowActiveAccess) {
    return <Navigate replace to="/" />;
  }

  if (error && allowBlocked) {
    return (
      <FullscreenState
        eyebrow="Acesso"
        title="Nao foi possivel validar a sessao"
        description={error}
      />
    );
  }

  return <Outlet />;
}
