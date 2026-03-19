import {
  createOrganization,
  createUser,
  deactivateUserById,
  getOrganizationById,
  getUserByEmail,
  updateUserPasswordById,
} from "../lib/data.js";
import { hashPassword, isValidPassword, verifyPassword } from "../lib/password.js";
import { evaluateSubscriptionAccess } from "../lib/subscription.js";

const LEGACY_DEMO_PASSWORD = "Agenda123!";
const LEGACY_DEMO_EMAILS = new Set(["contato@agendapro.app", "bloqueado@agendapro.app"]);

function normalizeEmail(email) {
  return typeof email === "string" ? email.trim().toLowerCase() : "";
}

function normalizePassword(password) {
  return typeof password === "string" ? password : "";
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeEmail(email));
}

function buildKnownToken(email) {
  return `known:${normalizeEmail(email)}`;
}

function buildNewUserToken(email) {
  return `new:${normalizeEmail(email)}`;
}

function buildPlatformAdminToken(email) {
  return `platform:${normalizeEmail(email)}`;
}

function readEmailFromToken(token) {
  const [, rawEmail] = token.split(":");
  return rawEmail ? normalizeEmail(rawEmail) : null;
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
  if (token?.startsWith("platform:")) {
    const email = readEmailFromToken(token);
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
    ? evaluateSubscriptionAccess(organization)
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
      nome: user?.nome ?? "Novo usuario",
      email: user?.email ?? readEmailFromToken(token),
      role: user?.role ?? "owner",
      organizationId: organization?.id ?? null,
    },
    organization: organization
      ? {
          id: organization.id,
          nomeEmpresa: organization.nome_empresa,
          monthlyAmount: Number(organization.monthly_amount ?? 0),
          subscriptionStatus: access.subscriptionStatus,
          subscriptionPlan: organization.subscription_plan,
          dueDate: organization.due_date,
          trialEnd: organization.trial_end,
          isBlocked: access.isBlocked,
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
  if (!token || token.startsWith("new:")) {
    const error = new Error("Autenticacao obrigatoria.");
    error.statusCode = 401;
    throw error;
  }

  if (!token.startsWith("known:")) {
    const error = new Error("Sessao invalida");
    error.statusCode = 401;
    throw error;
  }

  const email = readEmailFromToken(token);
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

export async function requirePlatformAdminContext(token) {
  if (!token?.startsWith("platform:")) {
    const error = new Error("Acesso de Super Admin obrigatorio.");
    error.statusCode = 403;
    throw error;
  }

  const email = readEmailFromToken(token);

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

export async function startLogin({ email, password, provider = "email" }) {
  const normalizedEmail = normalizeEmail(email);
  const normalizedPassword = normalizePassword(password);

  if (!normalizedEmail || !isValidEmail(normalizedEmail)) {
    const error = new Error("Informe um email valido.");
    error.statusCode = 400;
    throw error;
  }

  if (!normalizedPassword) {
    const error = new Error("Informe sua senha para continuar.");
    error.statusCode = 400;
    throw error;
  }

  if (provider !== "email") {
    const error = new Error("Login com Google e Apple sera liberado em breve. Por enquanto, use email e senha.");
    error.statusCode = 501;
    throw error;
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
  if (!token) {
    const error = new Error("Sessao nao encontrada");
    error.statusCode = 401;
    throw error;
  }

  if (token.startsWith("new:")) {
    return createSessionPayload({
      token,
      user: null,
      organization: null,
      needsOnboarding: true,
    });
  }

  if (token.startsWith("platform:")) {
    return createSessionPayload({
      token,
      user: null,
      organization: null,
      needsOnboarding: false,
    });
  }

  if (!token.startsWith("known:")) {
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

export async function completeOnboarding({ token, nome, nomeEmpresa, telefone, senha }) {
  if (!token?.startsWith("new:")) {
    const error = new Error("Onboarding invalido");
    error.statusCode = 400;
    throw error;
  }

  const email = readEmailFromToken(token);

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

  if (!isValidPassword(senha)) {
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
  });

  const user = await createUser({
    email,
    nome: nome.trim(),
    organizationId: organization.id,
    passwordHash: hashPassword(senha),
  });

  return getSessionByToken(buildKnownToken(user.email));
}

export function logout() {
  return { success: true };
}

export async function deleteAccount(token) {
  if (token?.startsWith("platform:")) {
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
