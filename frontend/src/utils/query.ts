import { ApiError } from "@/services/apiClient";

export function shouldRetryTransientQuery(error: unknown, failureCount: number) {
  return error instanceof ApiError && error.code === "NETWORK_ERROR" && failureCount < 2;
}
