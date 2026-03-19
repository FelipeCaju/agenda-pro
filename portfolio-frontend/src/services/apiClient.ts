import { storage } from "@/lib/storage";

function getDefaultApiUrl() {
  if (typeof window === "undefined") {
    return "http://localhost:3333/api";
  }

  const hostname = window.location.hostname || "localhost";
  return `http://${hostname}:3333/api`;
}

const API_URL = import.meta.env.VITE_API_URL ?? getDefaultApiUrl();

export type ApiMeta = {
  total?: number;
  page?: number;
  pageSize?: number;
  [key: string]: unknown;
};

export type ApiSuccess<T> = {
  data: T;
  meta?: ApiMeta;
  message?: string;
};

export type RequestQuery = Record<
  string,
  string | number | boolean | null | undefined
>;

type RequestOptions = {
  body?: unknown;
  headers?: HeadersInit;
  query?: RequestQuery;
  signal?: AbortSignal;
};

type ApiEnvelope<T> = {
  data: T;
  meta?: ApiMeta;
  message?: string;
};

type ApiErrorPayload = {
  message?: string;
  code?: string;
  details?: unknown;
};

export class ApiError extends Error {
  status: number;
  code: string | null;
  details: unknown;

  constructor({
    message,
    status,
    code = null,
    details,
  }: {
    message: string;
    status: number;
    code?: string | null;
    details?: unknown;
  }) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

function buildUrl(path: string, query?: RequestQuery) {
  const url = new URL(`${API_URL}${path}`);

  Object.entries(query ?? {}).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") {
      return;
    }

    url.searchParams.set(key, String(value));
  });

  return url.toString();
}

function isEnvelope<T>(payload: unknown): payload is ApiEnvelope<T> {
  return Boolean(payload) && typeof payload === "object" && "data" in (payload as object);
}

async function parseErrorPayload(response: Response) {
  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    return (await response.json()) as ApiErrorPayload;
  }

  const text = await response.text();
  return {
    message: text || `Falha na requisicao: ${response.status}`,
  } satisfies ApiErrorPayload;
}

function normalizeSuccess<T>(payload: unknown): ApiSuccess<T> {
  if (isEnvelope<T>(payload)) {
    return {
      data: payload.data,
      meta: payload.meta,
      message: payload.message,
    };
  }

  return { data: payload as T };
}

async function request<T>(
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
  path: string,
  options: RequestOptions = {},
): Promise<ApiSuccess<T>> {
  const token = storage.getAuthToken();
  let response: Response;

  try {
    response = await fetch(buildUrl(path, options.query), {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers ?? {}),
      },
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
      signal: options.signal,
    });
  } catch (error) {
    const isLocalApi = API_URL.includes("localhost:3333");
    throw new ApiError({
      message: isLocalApi
        ? "Nao foi possivel conectar ao servidor. Verifique se o backend esta rodando em http://localhost:3333."
        : "Nao foi possivel conectar ao servidor da API.",
      status: 0,
      code: "NETWORK_ERROR",
      details: error,
    });
  }

  if (!response.ok) {
    const payload = await parseErrorPayload(response);
    throw new ApiError({
      message: payload.message ?? `Falha na requisicao: ${response.status}`,
      status: response.status,
      code: payload.code,
      details: payload.details,
    });
  }

  if (response.status === 204) {
    return { data: undefined as T };
  }

  const contentType = response.headers.get("content-type") ?? "";

  if (!contentType.includes("application/json")) {
    return normalizeSuccess<T>(await response.text());
  }

  return normalizeSuccess<T>(await response.json());
}

export const apiClient = {
  get: <T>(path: string, options?: Omit<RequestOptions, "body">) =>
    request<T>("GET", path, options),
  post: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, "body">) =>
    request<T>("POST", path, { ...options, body }),
  put: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, "body">) =>
    request<T>("PUT", path, { ...options, body }),
  patch: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, "body">) =>
    request<T>("PATCH", path, { ...options, body }),
  delete: <T>(path: string, options?: Omit<RequestOptions, "body">) =>
    request<T>("DELETE", path, options),
};
