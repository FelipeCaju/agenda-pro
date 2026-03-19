import { ApiError } from "@/services/apiClient";
import { logDiagnosticError } from "@/utils/logger";

type ServiceCallOptions<T> = {
  fallbackData?: T;
  errorMessage: string;
};

function cloneFallback<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export function normalizeServiceError(error: unknown, errorMessage: string) {
  if (error instanceof ApiError) {
    return new ApiError({
      message: `${errorMessage} ${error.message}`.trim(),
      status: error.status,
      code: error.code,
      details: error.details,
    });
  }

  if (error instanceof Error) {
    return new Error(`${errorMessage} ${error.message}`.trim());
  }

  return new Error(errorMessage);
}

export async function executeServiceCall<T>(
  operation: () => Promise<T>,
  options: ServiceCallOptions<T>,
) {
  try {
    return await operation();
  } catch (error) {
    logDiagnosticError("service_call", error, {
      errorMessage: options.errorMessage,
      hasFallback: options.fallbackData !== undefined,
    });

    if (options.fallbackData !== undefined) {
      return cloneFallback(options.fallbackData);
    }

    throw normalizeServiceError(error, options.errorMessage);
  }
}
