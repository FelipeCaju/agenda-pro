function getRequiredEnv(name) {
  const value = String(process.env[name] ?? "").trim();

  if (!value) {
    const error = new Error(`A configuracao ${name} nao foi encontrada no servidor.`);
    error.statusCode = 500;
    throw error;
  }

  return value;
}

function normalizeDigits(value) {
  return String(value ?? "").replace(/\D+/g, "").trim();
}

function normalizeAsaasMobilePhone(value) {
  const digits = normalizeDigits(value);

  if (digits.length < 10 || digits.length > 11) {
    return "";
  }

  if (/^(\d)\1+$/.test(digits)) {
    return "";
  }

  return digits;
}

function getAsaasBaseUrl() {
  const explicitBaseUrl = String(process.env.ASAAS_API_BASE_URL ?? "").trim();

  if (explicitBaseUrl) {
    return explicitBaseUrl.replace(/\/+$/, "");
  }

  const environment = String(process.env.ASAAS_ENV ?? "sandbox").trim().toLowerCase();
  return environment === "production"
    ? "https://api.asaas.com/v3"
    : "https://sandbox.asaas.com/api/v3";
}

async function asaasRequest(path, { method = "GET", body, allowNotFound = false } = {}) {
  const response = await fetch(`${getAsaasBaseUrl()}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      access_token: getRequiredEnv("ASAAS_API_KEY"),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (allowNotFound && response.status === 404) {
    return null;
  }

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const description = Array.isArray(payload?.errors)
      ? payload.errors.map((item) => item.description).filter(Boolean).join(" ")
      : "";
    const error = new Error(description || payload?.message || "Falha ao comunicar com o Asaas.");
    error.statusCode = response.status;
    error.details = payload;
    throw error;
  }

  return payload;
}

export function getAsaasWebhookToken() {
  return getRequiredEnv("ASAAS_WEBHOOK_TOKEN");
}

export async function createAsaasCustomer(input) {
  const mobilePhone = normalizeAsaasMobilePhone(input.mobilePhone);
  const cpfCnpj = normalizeDigits(input.cpfCnpj);

  return asaasRequest("/customers", {
    method: "POST",
    body: {
      name: input.name,
      email: input.email ?? undefined,
      cpfCnpj: cpfCnpj || undefined,
      mobilePhone: mobilePhone || undefined,
      externalReference: input.externalReference ?? undefined,
      notificationDisabled: input.notificationDisabled ?? true,
    },
  });
}

export async function createAsaasSubscription(input) {
  return asaasRequest("/subscriptions", {
    method: "POST",
    body: {
      customer: input.customer,
      billingType: input.billingType ?? "PIX",
      value: input.value,
      nextDueDate: input.nextDueDate,
      cycle: input.cycle ?? "MONTHLY",
      description: input.description ?? undefined,
      externalReference: input.externalReference ?? undefined,
      endDate: input.endDate ?? undefined,
      maxPayments: input.maxPayments ?? undefined,
      fine: input.fine ?? undefined,
      interest: input.interest ?? undefined,
    },
  });
}

export async function cancelAsaasSubscription(subscriptionId) {
  return asaasRequest(`/subscriptions/${subscriptionId}`, {
    method: "DELETE",
  });
}

export async function listAsaasSubscriptionPayments(subscriptionId) {
  const payload = await asaasRequest(`/subscriptions/${subscriptionId}/payments`);
  return Array.isArray(payload?.data) ? payload.data : [];
}

export async function getAsaasPixQrCode(paymentId) {
  return asaasRequest(`/payments/${paymentId}/pixQrCode`, {
    allowNotFound: true,
  });
}
