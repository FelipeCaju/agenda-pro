type DiagnosticMeta = Record<string, unknown>;

function normalizeError(error: unknown) {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack ?? null,
    };
  }

  return {
    name: "UnknownError",
    message: typeof error === "string" ? error : "Erro desconhecido",
    stack: null,
  };
}

export function logDiagnosticError(scope: string, error: unknown, meta?: DiagnosticMeta) {
  const payload = {
    scope,
    ...normalizeError(error),
    meta: meta ?? null,
    timestamp: new Date().toISOString(),
  };

  console.error(`[AgendaPro][${scope}]`, payload);
}

export function getFriendlyErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}
