import cors from "cors";
import express from "express";
import {
  buildCorsOptions,
  createLoginProtectionMiddleware,
  createRateLimitMiddleware,
  securityHeadersMiddleware,
} from "./lib/security.js";
import { router } from "./routes/index.js";

export const app = express();

app.disable("x-powered-by");
app.set("trust proxy", 1);
app.use(securityHeadersMiddleware);
app.use(cors(buildCorsOptions()));
app.use(
  express.json({
    limit: "1mb",
    verify: (request, _response, buffer) => {
      request.rawBody = buffer.toString("utf8");
    },
  }),
);
app.use(
  "/api/auth/login",
  createRateLimitMiddleware({
    windowMs: Number(process.env.LOGIN_RATE_LIMIT_WINDOW_MS ?? 10 * 60 * 1000),
    maxRequests: Number(process.env.LOGIN_RATE_LIMIT_MAX_REQUESTS ?? 10),
    message: "Muitas requisicoes de login em pouco tempo. Tente novamente em alguns minutos.",
  }),
  createLoginProtectionMiddleware(),
);
app.use(
  "/api",
  createRateLimitMiddleware({
    windowMs: Number(process.env.SENSITIVE_RATE_LIMIT_WINDOW_MS ?? 60 * 1000),
    maxRequests: Number(process.env.SENSITIVE_RATE_LIMIT_MAX_REQUESTS ?? 60),
    message: "Muitas operacoes sensiveis em pouco tempo. Aguarde alguns instantes e tente novamente.",
    shouldSkip: (request) =>
      request.method === "GET" ||
      request.path === "/health" ||
      request.path === "/whatsapp/webhook" ||
      request.path === "/webhooks/asaas",
  }),
);
app.use("/api", router);
