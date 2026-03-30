import crypto from "node:crypto";

const DEFAULT_DEV_SECRET = "agendapro-dev-session-secret-change-me";

function createAuthError(message) {
  const error = new Error(message);
  error.statusCode = 401;
  return error;
}

function getSessionSecret() {
  const configuredSecret = String(process.env.SESSION_SECRET ?? "").trim();

  if (configuredSecret) {
    return configuredSecret;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("A variavel SESSION_SECRET precisa estar configurada em producao.");
  }

  return DEFAULT_DEV_SECRET;
}

function base64UrlEncode(value) {
  return Buffer.from(value, "utf8").toString("base64url");
}

function base64UrlDecode(value) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function signPayload(encodedPayload) {
  return crypto.createHmac("sha256", getSessionSecret()).update(encodedPayload).digest("base64url");
}

function getExpirySeconds(payloadType) {
  if (payloadType === "pending" || payloadType === "new") {
    const pendingMinutes = Number(process.env.PENDING_SESSION_TTL_MINUTES ?? 30);
    return Math.max(300, Math.floor(pendingMinutes * 60));
  }

  const sessionHours = Number(process.env.SESSION_TTL_HOURS ?? 12);
  return Math.max(1800, Math.floor(sessionHours * 60 * 60));
}

export function createSessionToken(payload) {
  const issuedAt = Math.floor(Date.now() / 1000);
  const expiresAt = issuedAt + getExpirySeconds(payload.type);
  const encodedPayload = base64UrlEncode(
    JSON.stringify({
      ...payload,
      iat: issuedAt,
      exp: expiresAt,
      v: 1,
    }),
  );

  return `agp1.${encodedPayload}.${signPayload(encodedPayload)}`;
}

export function verifySessionToken(token) {
  if (!token || typeof token !== "string") {
    throw createAuthError("Sessao nao encontrada");
  }

  const [version, encodedPayload, signature] = token.split(".");

  if (version !== "agp1" || !encodedPayload || !signature) {
    throw createAuthError("Sessao invalida");
  }

  const expectedSignature = signPayload(encodedPayload);
  const providedBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (
    providedBuffer.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(providedBuffer, expectedBuffer)
  ) {
    throw createAuthError("Sessao invalida");
  }

  let payload;

  try {
    payload = JSON.parse(base64UrlDecode(encodedPayload));
  } catch {
    throw createAuthError("Sessao invalida");
  }

  if (!payload || typeof payload !== "object" || typeof payload.type !== "string") {
    throw createAuthError("Sessao invalida");
  }

  if (typeof payload.exp !== "number" || payload.exp <= Math.floor(Date.now() / 1000)) {
    throw createAuthError("Sessao expirada");
  }

  return payload;
}
