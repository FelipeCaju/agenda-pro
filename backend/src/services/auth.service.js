import {
  createOrganization,
  createUser,
  deactivateUserById,
  getUserByAppleId,
  getOrganizationById,
  getUserByGoogleId,
  getUserByEmail,
  updateUserSocialIdentityById,
  updateUserPasswordById,
} from "../lib/data.js";
import { createRemoteJWKSet, jwtVerify } from "jose";
import { hashPassword, isValidPassword, verifyPassword } from "../lib/password.js";
import { createSessionToken, verifySessionToken } from "../lib/session-token.js";
import { resolveOrganizationBillingAccess } from "./billing.service.js";

const LEGACY_DEMO_PASSWORD = "Agenda123!";
const LEGACY_DEMO_EMAILS = new Set(["contato@agendapro.app", "bloqueado@agendapro.app"]);
const GOOGLE_JWKS = createRemoteJWKSet(new URL("https://www.googleapis.com/oauth2/v3/certs"));
const APPLE_JWKS = createRemoteJWKSet(new URL("https://appleid.apple.com/auth/keys"));

function normalizeEmail(email) {
  return typeof email === "string" ? email.trim().toLowerCase() : "";
}

function normalizePassword(password) {
  return typeof password === "string" ? password : "";
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeEmail(email));
}

function normalizeDocument(value) {
  return typeof value === "string" ? value.replace(/\D+/g, "").trim() : "";
}

function isValidCpfCnpj(value) {
  const digits = normalizeDocument(value);
  return digits.length === 11 || digits.length === 14;
}

function buildKnownToken(email) {
  return createSessionToken({
    type: "known",
    email: normalizeEmail(email),
  });
}

function buildNewUserToken(email) {
  return createSessionToken({
    type: "new",
    email: normalizeEmail(email),
  });
}

function buildPendingUserToken({ email, provider = "email", name = "", googleId = null, appleId = null }) {
  return createSessionToken({
    type: "pending",
    email: normalizeEmail(email),
    provider,
    name: typeof name === "string" ? name.trim() : "",
    googleId,
    appleId,
  });
}

function buildPlatformAdminToken(email) {
  return createSessionToken({
    type: "platform",
    email: normalizeEmail(email),
  });
}

function readTokenPayload(token) {
  return verifySessionToken(token);
}

function readPendingToken(token) {
  const payload = readTokenPayload(token);

  if (payload.type !== "pending") {
    return null;
  }

  return {
    email: normalizeEmail(payload.email),
    provider: payload.provider === "google" || payload.provider === "apple" ? payload.provider : "email",
    name: typeof payload.name === "string" ? payload.name.trim() : "",
    googleId: typeof payload.googleId === "string" ? payload.googleId : null,
    appleId: typeof payload.appleId === "string" ? payload.appleId : null,
  };
}

function getPlatformAdminEmails() {
  return String(process.env.PLATFORM_ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => normalizeEmail(email))
    .filter(Boolean);
}

function isPlatformAdminEmail(email) {
  return getPlatformAdminEmails().includes(normalizeEmail(email));
}

function getPlatformAdminPassword() {
  const value = normalizePassword(process.env.PLATFORM_ADMIN_PASSWORD);
  return value || null;
}

function buildPlatformAdminProfile(email) {
  const localPart = email.split("@")[0] ?? "admin";
  const normalizedName = localPart
    .split(/[._-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

  return {
    email,
    nome: normalizedName || "Super Admin",
  };
}

async function createSessionPayload({ token, user, organization, needsOnboarding }) {
  const tokenPayload = readTokenPayload(token);
  const pendingUser = tokenPayload.type === "pending" ? readPendingToken(token) : null;

  if (tokenPayload.type === "platform") {
    const email = normalizeEmail(tokenPayload.email ?? "");
    const adminProfile = buildPlatformAdminProfile(email ?? "admin@agendapro.app");

    return {
      token,
      scope: "platform",
      user: {
        id: `platform:${adminProfile.email}`,
        nome: adminProfile.nome,
        email: adminProfile.email,
        role: null,
        organizationId: null,
      },
      organization: null,
      access: {
        isBlocked: false,
        canAccess: true,
        blockReason: null,
        subscriptionStatus: null,
        isTrialValid: false,
        needsOnboarding: false,
      },
    };
  }

  const access = organization
    ? await resolveOrganizationBillingAccess(organization.id)
    : {
        subscriptionStatus: null,
        canAccess: false,
        isBlocked: false,
        blockReason: null,
        isTrialValid: false,
      };

  return {
    token,
    scope: "organization",
    user: {
      id: user?.id ?? null,
      nome: user?.nome ?? pendingUser?.name ?? "Novo usuario",
      email: user?.email ?? pendingUser?.email ?? normalizeEmail(tokenPayload.email ?? ""),
      role: user?.role ?? "owner",
      organizationId: organization?.id ?? null,
      authProvider: user?.auth_provider ?? pendingUser?.provider ?? "email",
    },
    organization: organization
      ? {
          id: organization.id,
          nomeEmpresa: organization.nome_empresa,
          monthlyAmount: Number(organization.monthly_amount ?? 0),
          subscriptionStatus: access.subscriptionStatus,
          subscriptionPlan: organization.subscription_plan,
          dueDate: access.dueDate ?? organization.due_date,
          trialEnd: access.trialEndsAt ?? organization.trial_end,
          isBlocked: access.isBlocked,
          pixKey: "",
          paymentGraceDays: 3,
          paymentAlertDays: 3,
          graceUntil: access.graceUntil ?? null,
        }
      : null,
    access: {
      isBlocked: access.isBlocked,
      canAccess: access.canAccess,
      blockReason: access.blockReason,
      subscriptionStatus: access.subscriptionStatus,
      isTrialValid: access.isTrialValid,
      needsOnboarding,
    },
  };
}

export async function requireAuthenticatedContext(token) {
  const tokenPayload = readTokenPayload(token);

  if (tokenPayload.type === "new") {
    const error = new Error("Autenticacao obrigatoria.");
    error.statusCode = 401;
    throw error;
  }

  if (tokenPayload.type !== "known") {
    const error = new Error("Sessao invalida");
    error.statusCode = 401;
    throw error;
  }

  const email = normalizeEmail(tokenPayload.email ?? "");
  const user = email ? await getUserByEmail(email) : null;

  if (!user || !user.ativo) {
    const error = new Error("Sessao expirada");
    error.statusCode = 401;
    throw error;
  }

  const organization = await getOrganizationById(user.organization_id);

  if (!organization) {
    const error = new Error("Organizacao nao encontrada.");
    error.statusCode = 404;
    throw error;
  }

  return {
    token,
    user,
    organization,
  };
}

function normalizeProvider(value) {
  return value === "google" || value === "apple" ? value : "email";
}

function getRequiredEnv(name) {
  const value = String(process.env[name] ?? "").trim();

  if (!value) {
    const error = new Error(`A configuracao ${name} nao foi encontrada no servidor.`);
    error.statusCode = 500;
    throw error;
  }

  return value;
}

function normalizeSocialName(name, email) {
  const normalizedName = typeof name === "string" ? name.trim() : "";

  if (normalizedName) {
    return normalizedName;
  }

  const localPart = normalizeEmail(email).split("@")[0] ?? "Usuario";
  return (
    localPart
      .split(/[._-]+/)
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ") || "Novo usuario"
  );
}

async function verifyGoogleIdentityToken(idToken) {
  const audience = getRequiredEnv("GOOGLE_CLIENT_ID");
  const { payload } = await jwtVerify(idToken, GOOGLE_JWKS, {
    issuer: ["https://accounts.google.com", "accounts.google.com"],
    audience,
  });

  const email = normalizeEmail(payload.email);
  const emailVerified = payload.email_verified === true || payload.email_verified === "true";

  if (!email || !emailVerified) {
    const error = new Error("Nao foi possivel validar o email da conta Google.");
    error.statusCode = 401;
    throw error;
  }

  return {
    provider: "google",
    providerUserId: String(payload.sub ?? ""),
    email,
    name: normalizeSocialName(payload.name, email),
  };
}

async function verifyAppleIdentityToken(idToken) {
  const audience = getRequiredEnv("APPLE_CLIENT_ID");
  const { payload } = await jwtVerify(idToken, APPLE_JWKS, {
    issuer: "https://appleid.apple.com",
    audience,
  });

  const email = normalizeEmail(payload.email);
  const emailVerified = payload.email_verified === true || payload.email_verified === "true";

  if (!email || !emailVerified) {
    const error = new Error("Nao foi possivel validar o email da conta Apple.");
    error.statusCode = 401;
    throw error;
  }

  return {
    provider: "apple",
    providerUserId: String(payload.sub ?? ""),
    email,
    name: normalizeSocialName(payload.name, email),
  };
}

async function verifySocialLogin({ provider, idToken }) {
  if (!idToken) {
    const error = new Error("Token de autenticacao social nao informado.");
    error.statusCode = 400;
    throw error;
  }

  try {
    return provider === "google"
      ? await verifyGoogleIdentityToken(idToken)
      : await verifyAppleIdentityToken(idToken);
  } catch (verificationError) {
    if (verificationError && typeof verificationError === "object" && "statusCode" in verificationError) {
      throw verificationError;
    }

    const error = new Error(
      provider === "google"
        ? "Nao foi possivel validar o login com Google."
        : "Nao foi possivel validar o login com Apple.",
    );
    error.statusCode = 401;
    throw error;
  }
}

export async function requireActiveAuthenticatedContext(token) {
  const context = await requireAuthenticatedContext(token);
  const access = await resolveOrganizationBillingAccess(context.organization.id);

  if (!access.canAccess) {
    const error = new Error(
      access.blockReason === "payment_overdue"
        ? "Seu acesso esta temporariamente bloqueado. Regularize o pagamento ou avise o administrador se ele ja foi feito."
        : access.blockReason === "trial_expired"
          ? "O periodo de teste terminou. Ajuste a assinatura para voltar a usar o sistema."
          : "Sua organizacao esta com o acesso restrito no momento.",
    );
    error.statusCode = 402;
    error.code = access.blockReason ?? "subscription_blocked";
    throw error;
  }

  return context;
}

export async function requirePlatformAdminContext(token) {
  const tokenPayload = readTokenPayload(token);

  if (tokenPayload.type !== "platform") {
    const error = new Error("Acesso de Super Admin obrigatorio.");
    error.statusCode = 403;
    throw error;
  }

  const email = normalizeEmail(tokenPayload.email ?? "");

  if (!email || !isPlatformAdminEmail(email)) {
    const error = new Error("Super Admin nao autorizado.");
    error.statusCode = 403;
    throw error;
  }

  return {
    token,
    admin: buildPlatformAdminProfile(email),
  };
}

export async function startLogin({ email, password, provider = "email", idToken = "" }) {
  const normalizedProvider = normalizeProvider(provider);
  const normalizedEmail = normalizeEmail(email);
  const normalizedPassword = normalizePassword(password);

  if (normalizedProvider === "email" && (!normalizedEmail || !isValidEmail(normalizedEmail))) {
    const error = new Error("Informe um email valido.");
    error.statusCode = 400;
    throw error;
  }

  if (normalizedProvider === "email" && !normalizedPassword) {
    const error = new Error("Informe sua senha para continuar.");
    error.statusCode = 400;
    throw error;
  }

  if (normalizedProvider !== "email") {
    const identity = await verifySocialLogin({ provider: normalizedProvider, idToken });
    const user =
      (normalizedProvider === "google"
        ? await getUserByGoogleId(identity.providerUserId)
        : await getUserByAppleId(identity.providerUserId)) ?? (await getUserByEmail(identity.email));

    if (!user) {
      return {
        token: buildPendingUserToken({
          email: identity.email,
          provider: identity.provider,
          name: identity.name,
          googleId: identity.provider === "google" ? identity.providerUserId : null,
          appleId: identity.provider === "apple" ? identity.providerUserId : null,
        }),
      };
    }

    if (!user.ativo) {
      const error = new Error("Esta conta esta inativa.");
      error.statusCode = 403;
      throw error;
    }

    await updateUserSocialIdentityById(user.id, {
      googleId: identity.provider === "google" ? identity.providerUserId : undefined,
      appleId: identity.provider === "apple" ? identity.providerUserId : undefined,
      authProvider: identity.provider,
    });

    return { token: buildKnownToken(identity.email) };
  }

  if (isPlatformAdminEmail(normalizedEmail)) {
    const platformAdminPassword = getPlatformAdminPassword();

    if (platformAdminPassword && normalizedPassword !== platformAdminPassword) {
      const error = new Error("Senha do proprietario invalida.");
      error.statusCode = 401;
      throw error;
    }

    return { token: buildPlatformAdminToken(normalizedEmail) };
  }

  const user = await getUserByEmail(normalizedEmail);

  if (!user) {
    return { token: buildNewUserToken(normalizedEmail) };
  }

  if (!user.ativo) {
    const error = new Error("Esta conta esta inativa.");
    error.statusCode = 403;
    throw error;
  }

  if (!user.password_hash) {
    if (LEGACY_DEMO_EMAILS.has(normalizedEmail) && normalizedPassword === LEGACY_DEMO_PASSWORD) {
      await updateUserPasswordById(user.id, hashPassword(normalizedPassword));
      return { token: buildKnownToken(normalizedEmail) };
    }

    const error = new Error(
      "Esta conta ainda nao tem senha cadastrada. Defina uma senha inicial pelo painel do proprietario.",
    );
    error.statusCode = 403;
    throw error;
  }

  if (!verifyPassword(normalizedPassword, user.password_hash)) {
    const error = new Error("Email ou senha invalidos.");
    error.statusCode = 401;
    throw error;
  }

  return { token: buildKnownToken(normalizedEmail) };
}

export async function getSessionByToken(token) {
  const tokenPayload = readTokenPayload(token);

  if (tokenPayload.type === "pending") {
    return createSessionPayload({
      token,
      user: null,
      organization: null,
      needsOnboarding: true,
    });
  }

  if (tokenPayload.type === "new") {
    return createSessionPayload({
      token,
      user: null,
      organization: null,
      needsOnboarding: true,
    });
  }

  if (tokenPayload.type === "platform") {
    return createSessionPayload({
      token,
      user: null,
      organization: null,
      needsOnboarding: false,
    });
  }

  if (tokenPayload.type !== "known") {
    const error = new Error("Sessao invalida");
    error.statusCode = 401;
    throw error;
  }

  const { organization, user } = await requireAuthenticatedContext(token);

  return createSessionPayload({
    token,
    user,
    organization,
    needsOnboarding: false,
  });
}

export async function completeOnboarding({ token, nome, nomeEmpresa, telefone, cpfCnpj, senha }) {
  const tokenPayload = readTokenPayload(token);
  const pendingUser = tokenPayload.type === "pending" ? readPendingToken(token) : null;

  if (tokenPayload.type !== "new" && !pendingUser) {
    const error = new Error("Onboarding invalido");
    error.statusCode = 400;
    throw error;
  }

  const provider = pendingUser?.provider ?? "email";
  const email = pendingUser?.email ?? normalizeEmail(tokenPayload.email ?? "");

  if (!email) {
    const error = new Error("Email do onboarding invalido");
    error.statusCode = 400;
    throw error;
  }

  if (!nome?.trim() || !nomeEmpresa?.trim()) {
    const error = new Error("Nome e nome da empresa sao obrigatorios");
    error.statusCode = 400;
    throw error;
  }

  if (!isValidCpfCnpj(cpfCnpj)) {
    const error = new Error("CPF/CNPJ obrigatorio e invalido.");
    error.statusCode = 400;
    throw error;
  }

  if (provider === "email" && !isValidPassword(senha)) {
    const error = new Error("A senha precisa ter pelo menos 8 caracteres.");
    error.statusCode = 400;
    throw error;
  }

  const existingUser = await getUserByEmail(email);

  if (existingUser) {
    const error = new Error("Este email ja esta cadastrado. Entre com a senha da conta.");
    error.statusCode = 409;
    throw error;
  }

  const organization = await createOrganization({
    emailResponsavel: email,
    nomeEmpresa: nomeEmpresa.trim(),
    telefone,
    cpfCnpj: normalizeDocument(cpfCnpj),
  });

  const user = await createUser({
    email,
    nome: nome.trim(),
    organizationId: organization.id,
    authProvider: provider,
    passwordHash: provider === "email" ? hashPassword(senha) : null,
    googleId: pendingUser?.googleId ?? null,
    appleId: pendingUser?.appleId ?? null,
  });

  return getSessionByToken(buildKnownToken(user.email));
}

export function logout() {
  return { success: true };
}

export async function deleteAccount(token) {
  const tokenPayload = readTokenPayload(token);

  if (tokenPayload.type === "platform") {
    return { success: true };
  }

  const { user } = await requireAuthenticatedContext(token);
  const deletedUser = await deactivateUserById(user.id);

  if (!deletedUser) {
    const error = new Error("Conta nao encontrada.");
    error.statusCode = 404;
    throw error;
  }

  return { success: true };
}
