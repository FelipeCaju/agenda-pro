import {
  getOrganizationById,
  listOrganizationPayments,
  listUsersByOrganization,
  updateOrganizationById,
} from "../lib/data.js";
import {
  evaluateSubscriptionAccess,
  isValidSubscriptionStatus,
} from "../lib/subscription.js";

function normalizeString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function buildOrganizationPayload(organization) {
  const access = evaluateSubscriptionAccess(organization);

  return {
    id: organization.id,
    nome_empresa: organization.nome_empresa,
    email_responsavel: organization.email_responsavel,
    telefone: organization.telefone,
    monthly_amount: Number(organization.monthly_amount ?? 0),
    subscription_status: access.subscriptionStatus,
    subscription_plan: organization.subscription_plan,
    due_date: organization.due_date,
    trial_end: organization.trial_end,
    is_blocked: access.isBlocked,
    block_reason: access.blockReason,
    can_access: access.canAccess,
    is_trial_valid: access.isTrialValid,
  };
}

function buildMemberPayload(user) {
  return {
    id: user.id,
    nome: user.nome,
    email: user.email,
    role: user.role,
    ativo: Boolean(user.ativo),
  };
}

export async function getCurrentOrganization({ organizationId }) {
  const organization = await getOrganizationById(organizationId);

  if (!organization) {
    const error = new Error("Organizacao nao encontrada.");
    error.statusCode = 404;
    throw error;
  }

  return buildOrganizationPayload(organization);
}

export async function listOrganizationMembers({ organizationId }) {
  const members = await listUsersByOrganization(organizationId);
  return members.map(buildMemberPayload);
}

export async function listCurrentOrganizationPayments({ organizationId }) {
  const organization = await getOrganizationById(organizationId);

  if (!organization) {
    const error = new Error("Organizacao nao encontrada.");
    error.statusCode = 404;
    throw error;
  }

  return listOrganizationPayments(organizationId);
}

export async function updateCurrentOrganization({ organizationId, input }) {
  const nomeEmpresa = input.nome_empresa ?? input.nomeEmpresa;
  const emailResponsavel = input.email_responsavel ?? input.emailResponsavel;
  const telefone = input.telefone;
  const subscriptionStatus = input.subscription_status ?? input.subscriptionStatus;
  const trialEnd = input.trial_end ?? input.trialEnd;
  const monthlyAmount = input.monthly_amount ?? input.monthlyAmount;

  if (nomeEmpresa !== undefined && !normalizeString(nomeEmpresa)) {
    const error = new Error("Nome da empresa e obrigatorio.");
    error.statusCode = 400;
    throw error;
  }

  if (emailResponsavel !== undefined) {
    const normalizedEmail = normalizeString(emailResponsavel).toLowerCase();

    if (!normalizedEmail || !isValidEmail(normalizedEmail)) {
      const error = new Error("Email responsavel invalido.");
      error.statusCode = 400;
      throw error;
    }
  }

  if (subscriptionStatus !== undefined && !isValidSubscriptionStatus(subscriptionStatus)) {
    const error = new Error("Status de assinatura invalido.");
    error.statusCode = 400;
    throw error;
  }

  if (
    trialEnd !== undefined &&
    trialEnd !== null &&
    !/^\d{4}-\d{2}-\d{2}$/.test(normalizeString(trialEnd))
  ) {
    const error = new Error("Data final do trial invalida.");
    error.statusCode = 400;
    throw error;
  }

  if (monthlyAmount !== undefined) {
    const normalizedMonthlyAmount = Number(monthlyAmount);

    if (!Number.isFinite(normalizedMonthlyAmount) || normalizedMonthlyAmount < 0) {
      const error = new Error("Mensalidade invalida.");
      error.statusCode = 400;
      throw error;
    }
  }

  const nextOrganization = await updateOrganizationById(organizationId, {
    nome_empresa: nomeEmpresa !== undefined ? normalizeString(nomeEmpresa) : undefined,
    email_responsavel:
      emailResponsavel !== undefined ? normalizeString(emailResponsavel).toLowerCase() : undefined,
    telefone: telefone !== undefined ? normalizeString(telefone) : undefined,
    monthly_amount: monthlyAmount !== undefined ? Number(monthlyAmount) : undefined,
    subscription_status: subscriptionStatus,
    subscription_plan: input.subscription_plan ?? input.subscriptionPlan,
    due_date: input.due_date ?? input.dueDate,
    trial_end: trialEnd !== undefined ? normalizeString(trialEnd) || null : undefined,
  });

  if (!nextOrganization) {
    const error = new Error("Organizacao nao encontrada.");
    error.statusCode = 404;
    throw error;
  }

  return buildOrganizationPayload(nextOrganization);
}
