import { loadEnvironment } from "../lib/env.js";
import { getAppSettingsByOrganization } from "../lib/data.js";

loadEnvironment();

const lastTestByOrganization = new Map();

function buildError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function getEnvironmentConfig() {
  return {
    baseUrl: process.env.Z_API_BASE_URL?.trim() ?? "",
    instanceId: process.env.Z_API_INSTANCE_ID?.trim() ?? "",
    token: process.env.Z_API_TOKEN?.trim() ?? "",
    clientToken: process.env.Z_API_CLIENT_TOKEN?.trim() ?? "",
  };
}

function normalizePhone(phone) {
  const digits = String(phone ?? "").replace(/\D/g, "");

  if (!digits) {
    return "";
  }

  if (digits.startsWith("55")) {
    return digits;
  }

  if (digits.length === 10 || digits.length === 11) {
    return `55${digits}`;
  }

  return digits;
}

async function getOrganizationSettings(organizationId) {
  const settings = await getAppSettingsByOrganization(organizationId);

  if (!settings) {
    throw buildError("Configuracoes da empresa nao encontradas.", 404);
  }

  return settings;
}

function getProviderConfig(settings) {
  const envConfig = getEnvironmentConfig();
  const hasEnvZApiConfig = Boolean(
    envConfig.baseUrl && envConfig.instanceId && envConfig.token && envConfig.clientToken,
  );
  const settingsProvider = settings.whatsapp_api_provider?.trim() || "";
  const provider =
    hasEnvZApiConfig && (!settingsProvider || settingsProvider === "manual" || settingsProvider === "demo")
      ? "z-api"
      : settingsProvider || (hasEnvZApiConfig ? "z-api" : "manual");
  const instanceId = envConfig.instanceId || settings.whatsapp_instance_id?.trim() || "";
  const token = envConfig.token || settings.whatsapp_api_token?.trim() || "";
  const baseUrl = envConfig.baseUrl || settings.whatsapp_api_url?.trim() || "";

  return {
    provider,
    instanceId,
    token,
    baseUrl,
    clientToken: envConfig.clientToken,
  };
}

function buildZApiUrl({ baseUrl, instanceId, token }) {
  const normalizedBase = baseUrl.replace(/\/+$/, "");
  return `${normalizedBase}/instances/${instanceId}/token/${token}/send-text`;
}

async function sendViaZApi({ providerConfig, phone, message }) {
  if (
    !providerConfig.baseUrl ||
    !providerConfig.instanceId ||
    !providerConfig.token ||
    !providerConfig.clientToken
  ) {
    throw buildError(
      "Credenciais da Z-API nao configuradas no backend.",
      500,
    );
  }

  const response = await fetch(buildZApiUrl(providerConfig), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Client-Token": providerConfig.clientToken,
    },
    body: JSON.stringify({
      phone,
      message,
    }),
  });

  const text = await response.text();
  let payload = null;

  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = { raw: text };
    }
  }

  if (!response.ok) {
    const providerMessage =
      payload?.message ||
      payload?.error ||
      payload?.raw ||
      `Falha ao enviar mensagem via Z-API (${response.status}).`;

    throw buildError(String(providerMessage), response.status >= 400 && response.status < 500 ? 400 : 502);
  }

  return payload ?? { success: true };
}

export async function getWhatsappStatus({ organizationId }) {
  const settings = await getOrganizationSettings(organizationId);
  const providerConfig = getProviderConfig(settings);

  return {
    ativo: Boolean(settings.whatsapp_ativo),
    provider: providerConfig.provider || "manual",
    instanceId: providerConfig.instanceId || null,
    ultimoTesteEm: lastTestByOrganization.get(organizationId) ?? null,
    configurado: Boolean(
      providerConfig.provider === "z-api" &&
        providerConfig.baseUrl &&
        providerConfig.instanceId &&
        providerConfig.token &&
        providerConfig.clientToken,
    ),
  };
}

export async function sendWhatsappMessage({ organizationId, phone, message }) {
  const settings = await getOrganizationSettings(organizationId);
  const providerConfig = getProviderConfig(settings);
  const normalizedPhone = normalizePhone(phone);

  if (!settings.whatsapp_ativo) {
    throw buildError("WhatsApp desativado para esta empresa.", 400);
  }

  if (!normalizedPhone) {
    throw buildError("Telefone obrigatorio para envio via WhatsApp.", 400);
  }

  if (!message?.trim()) {
    throw buildError("Mensagem obrigatoria para envio via WhatsApp.", 400);
  }

  if (providerConfig.provider !== "z-api") {
    throw buildError(
      "Provider de WhatsApp nao configurado para envio real.",
      400,
    );
  }

  const providerResponse = await sendViaZApi({
    providerConfig,
    phone: normalizedPhone,
    message: message.trim(),
  });

  return {
    success: true,
    provider: providerConfig.provider,
    instanceId: providerConfig.instanceId ?? null,
    sentAt: new Date().toISOString(),
    providerResponse,
  };
}

export async function sendWhatsappTestMessage({ organizationId, input }) {
  const result = await sendWhatsappMessage({
    organizationId,
    phone: input.phone,
    message: input.message,
  });

  lastTestByOrganization.set(organizationId, result.sentAt);
  return result;
}
