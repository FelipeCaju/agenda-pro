import { useEffect } from "react";
import { isRouteErrorResponse, useRouteError } from "react-router-dom";
import { ErrorFallback } from "@/components/ui/error-fallback";
import { getFriendlyErrorMessage, logDiagnosticError } from "@/utils/logger";

export function RouteErrorPage() {
  const error = useRouteError();

  useEffect(() => {
    logDiagnosticError("route_error", error);
  }, [error]);

  const description = isRouteErrorResponse(error)
    ? `${error.status} ${error.statusText}`
    : getFriendlyErrorMessage(error, "Nao foi possivel abrir essa tela agora.");

  return (
    <ErrorFallback
      description={description}
      onRetry={() => window.location.reload()}
      title="Esta tela encontrou um erro"
    />
  );
}
