import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "react-router-dom";
import { GlobalDiagnostics } from "@/components/app/global-diagnostics";
import { AppErrorBoundary } from "@/components/ui/app-error-boundary";
import { FullscreenState } from "@/components/ui/fullscreen-state";
import { AuthProvider } from "@/context/auth-context";
import { queryClient } from "@/lib/query-client";
import { router } from "@/routes/app-router";
import "@/index.css";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Elemento #root nao encontrado para inicializar o AgendaPro.");
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <AppErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <GlobalDiagnostics />
        <AuthProvider>
          <RouterProvider
            fallbackElement={
              <FullscreenState
                eyebrow="AgendaPro"
                title="Carregando interface"
                description="Estamos preparando a navegacao sem travar sua experiencia."
              />
            }
            router={router}
          />
        </AuthProvider>
      </QueryClientProvider>
    </AppErrorBoundary>
  </React.StrictMode>,
);
