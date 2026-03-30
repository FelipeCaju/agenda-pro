function parseAllowedOrigins() {
  return String(process.env.CORS_ALLOWED_ORIGINS ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

function isLocalDevelopmentOrigin(origin) {
  return /^(https?:\/\/)(localhost|127\.0\.0\.1|10\.0\.2\.2)(:\d+)?$/i.test(origin);
}

function getClientIp(request) {
  const forwardedFor = request.headers["x-forwarded-for"];

  if (typeof forwardedFor === "string" && forwardedFor.trim()) {
    return forwardedFor.split(",")[0].trim();
  }

  return request.ip || request.socket?.remoteAddress || "unknown";
}

export function buildCorsOptions() {
  const configuredOrigins = parseAllowedOrigins();
  const allowAnyOrigin = configuredOrigins.includes("*");

  return {
    origin(origin, callback) {
      if (!origin) {
        callback(null, true);
        return;
      }

      if (allowAnyOrigin || configuredOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      if (process.env.NODE_ENV !== "production" && isLocalDevelopmentOrigin(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error("Origem nao autorizada pelo CORS."));
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  };
}

export function securityHeadersMiddleware(_request, response, next) {
  response.setHeader("X-Content-Type-Options", "nosniff");
  response.setHeader("X-Frame-Options", "DENY");
  response.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  response.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  response.setHeader("Cross-Origin-Opener-Policy", "same-origin");

  if (process.env.NODE_ENV === "production") {
    response.setHeader(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains",
    );
  }

  next();
}

export function createRateLimitMiddleware({
  windowMs,
  maxRequests,
  message,
  keySelector = (request) => getClientIp(request),
  shouldSkip,
}) {
  const store = new Map();

  return (request, response, next) => {
    if (shouldSkip?.(request)) {
      next();
      return;
    }

    const key = keySelector(request);
    const now = Date.now();
    const current = store.get(key);

    if (!current || current.resetAt <= now) {
      store.set(key, { count: 1, resetAt: now + windowMs });
      next();
      return;
    }

    current.count += 1;

    if (current.count > maxRequests) {
      response.setHeader("Retry-After", String(Math.ceil((current.resetAt - now) / 1000)));
      response.status(429).json({
        message,
        code: "RATE_LIMITED",
      });
      return;
    }

    next();
  };
}

export function createLoginProtectionMiddleware() {
  const failures = new Map();
  const windowMs = Number(process.env.LOGIN_RATE_LIMIT_WINDOW_MS ?? 10 * 60 * 1000);
  const blockMs = Number(process.env.LOGIN_BLOCK_WINDOW_MS ?? 15 * 60 * 1000);
  const maxFailures = Number(process.env.LOGIN_MAX_FAILURES ?? 5);

  function cleanupEntry(entry, now) {
    if (entry.failureWindowEndsAt <= now) {
      entry.failures = 0;
      entry.failureWindowEndsAt = now + windowMs;
    }

    if (entry.blockedUntil <= now) {
      entry.blockedUntil = 0;
    }
  }

  return (request, response, next) => {
    const key = `${getClientIp(request)}:${String(request.body?.email ?? "").trim().toLowerCase()}`;
    const now = Date.now();
    const current =
      failures.get(key) ??
      {
        failures: 0,
        failureWindowEndsAt: now + windowMs,
        blockedUntil: 0,
      };

    cleanupEntry(current, now);
    failures.set(key, current);

    if (current.blockedUntil > now) {
      response.setHeader("Retry-After", String(Math.ceil((current.blockedUntil - now) / 1000)));
      response.status(429).json({
        message: "Muitas tentativas de login. Aguarde alguns minutos antes de tentar novamente.",
        code: "LOGIN_TEMPORARILY_BLOCKED",
      });
      return;
    }

    const originalJson = response.json.bind(response);
    response.json = (payload) => {
      if (response.statusCode >= 400) {
        current.failures += 1;

        if (current.failures >= maxFailures) {
          current.blockedUntil = Date.now() + blockMs;
        }
      } else {
        failures.delete(key);
      }

      return originalJson(payload);
    };

    next();
  };
}
