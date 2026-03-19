import { Navigate, Outlet, useLocation } from "react-router-dom";
import { FullscreenState } from "@/components/ui/fullscreen-state";
import { useAuth } from "@/hooks/use-auth";

export function AdminProtectedRoute() {
  const location = useLocation();
  const { isAuthenticated, isLoading, isPlatformAdmin } = useAuth();

  if (isLoading) {
    return (
      <FullscreenState
        eyebrow="Administrador"
        title="Carregando acesso administrativo"
        description="Estamos validando seu acesso de administrador do sistema."
      />
    );
  }

  if (!isAuthenticated) {
    return <Navigate replace state={{ from: location.pathname }} to="/login" />;
  }

  if (!isPlatformAdmin) {
    return <Navigate replace to="/" />;
  }

  return <Outlet />;
}
