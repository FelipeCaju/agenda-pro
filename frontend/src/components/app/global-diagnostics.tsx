import { useEffect } from "react";
import { logDiagnosticError } from "@/utils/logger";

export function GlobalDiagnostics() {
  useEffect(() => {
    const onError = (event: ErrorEvent) => {
      logDiagnosticError("window_error", event.error ?? event.message, {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      });
    };

    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      logDiagnosticError("unhandled_rejection", event.reason);
    };

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onUnhandledRejection);

    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onUnhandledRejection);
    };
  }, []);

  return null;
}
