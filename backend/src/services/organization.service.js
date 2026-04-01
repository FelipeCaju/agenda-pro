import {
  createOrganizationPayment,
  getLatestOrganizationPayment,
  getOrganizationById,
  getPlatformSettings,
  listOrganizationPayments,
  listUsersByOrganization,
  notifyOrganizationPaymentPaid,
  updateOrganizationById,
} from "../lib/data.js";
import {
  evaluateSubscriptionAccess,
  isValidSubscriptionStatus,
} from "../lib/subscription.js";
import { sendPlatformWhatsappMessage } from "./whatsapp.service.js";

function normalizeString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function getTodayDate() {
  return new Date().toISOString().slice(0, 10);
}

function getReferenceMonth(date) {
  return String(date ?? "").slice(0, 7);
}

function formatCurrency(value) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(value ?? 0));
}

async function ensureActionablePayment({ organization, latestPayment, access }) {
  const shouldEnsurePayment = ["trial_expired", "payment_overdue"].includes(access.blockReason);

  if (!shouldEnsurePayment) {
    return latestPayment;
  }

  if (latestPayment && latestPayment.status !== "paid" && latestPayment.status !== "canceled") {
    return latestPayment;
  }

  const dueDate = organization.due_date ?? getTodayDate();
  const referenceMonth = getReferenceMonth(dueDate) || getReferenceMonth(getTodayDate());

  return createOrganizationPayment(organization.id, {
    reference_month: referenceMonth,
    amount: Number(organization.monthly_amount ?? 0),
    status: "pending",
    due_date: dueDate,
    payment_method: "pix",
    notes: "Cobranca criada automaticamente para regularizacao manual da assinatura.",
  });
}

function buildAdminPaymentWhatsappMessage({ organization, payment }) {
  return [
    "AgendaPro - solicitacao de liberacao apos pagamento",
    "",
    `Cliente: ${organization.nome_empresa}`,
    `Email: ${organization.email_responsavel}`,
    `Telefone: ${organization.telefone || "Nao informado"}`,
    `Valor: ${formatCurrency(payment.amount)}`,
    `Referencia: ${payment.reference_month}`,
    `Vencimento: ${payment.due_date || "Nao informado"}`,
    "",
    "O cliente informou que realizou o pagamento e aguarda a liberacao do acesso.",
  ].join("\n");
}

async function buildOrganizationPayload(organization) {
  const platformSettings = await getPlatformSettings();
  let latestPayment = await getLatestOrganizationPayment(organization.id);
  let access = evaluateSubscriptionAccess(organization, latestPayment, platformSettings);

  latestPayment = await ensureActionablePayment({ organization, latestPayment, access });
  access = evaluateSubscriptionAccess(organization, latestPayment, platformSettings);

  return {
    id: organization.id,
    nome_empresa: organization.nome_empresa,
    email_responsavel: organization.email_responsavel,
    telefone: organization.telefone,
    monthly_amount: Number(organization.monthly_amount ?? 0),
    subscription_status: access.subscriptionStatus,
    subscription_plan: organization.subscription_plan,
    due_date: access.dueDate ?? organization.due_date,
    trial_end: organization.trial_end,
    is_blocked: access.isBlocked,
    block_reason: access.blockReason,
    can_access: access.canAccess,
    is_trial_valid: access.isTrialValid,
    pix_key: platformSettings.pix_key,
    payment_grace_days: access.graceDays,
    payment_alert_days: access.alertDays,
    grace_until: access.graceUntil,
    latest_payment_id: latestPayment?.id ?? null,
    latest_payment_status: latestPayment?.status ?? null,
    latest_reference_month: latestPayment?.reference_month ?? null,
    latest_payment_amount: latestPayment?.amount ?? Number(organization.monthly_amount ?? 0),
    payment_notice_visible: access.shouldShowPaymentNotice,
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

export async function markCurrentOrganizationPaymentAsPaid({ organizationId, paymentId, note }) {
  const organization = await getOrganizationById(organizationId);

  if (!organization) {
    const error = new Error("Organizacao nao encontrada.");
    error.statusCode = 404;
    throw error;
  }

  const platformSettings = await getPlatformSettings();
  let resolvedPaymentId =
    paymentId && paymentId !== "current" ? paymentId : null;

  if (!resolvedPaymentId) {
    const latestPayment = await getLatestOrganizationPayment(organizationId);
    const access = evaluateSubscriptionAccess(organization, latestPayment, platformSettings);
    const actionablePayment = await ensureActionablePayment({
      organization,
      latestPayment,
      access,
    });

    resolvedPaymentId = actionablePayment?.id ?? null;
  }

  if (!resolvedPaymentId) {
    const error = new Error("Nao foi possivel identificar a cobranca para este pagamento.");
    error.statusCode = 400;
    throw error;
  }

  const payment = await notifyOrganizationPaymentPaid(organizationId, resolvedPaymentId, note);

  if (!payment) {
    const error = new Error("Pagamento nao encontrado.");
    error.statusCode = 404;
    throw error;
  }

  await sendPlatformWhatsappMessage({
    phone: platformSettings.admin_whatsapp_number,
    message: buildAdminPaymentWhatsappMessage({ organization, payment }),
  });

  return payment;
}
