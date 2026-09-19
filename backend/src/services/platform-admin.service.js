import {
  createOrganization,
  createOrganizationPayment,
  createUser,
  getAdminOrganizationDetails,
  getPlatformSettings,
  listAdminOrganizations,
  listOrganizationPayments,
  updatePlatformSettings,
  updateOrganizationById,
} from "../lib/data.js";
import { resolveOrganizationBillingAccess } from "./billing.service.js";
import { hashPassword, isValidPassword } from "../lib/password.js";
import { isValidSubscriptionStatus } from "../lib/subscription.js";
import {
  getOrganizationBillingAggregate,
  getOrganizationSubscriptionByOrganizationId,
  runBillingTransaction,
  updateOrganizationSubscription,
  upsertOrganizationAccessLock,
} from "../repositories/billing.repository.js";

function normalizeString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function isValidReferenceMonth(value) {
  return /^\d{4}-\d{2}$/.test(value);
}

function isValidDate(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function normalizeDocument(value) {
  return typeof value === "string" ? value.replace(/\D+/g, "").trim() : "";
}

function isValidCpfCnpj(value) {
  const digits = normalizeDocument(value);
  return digits.length === 11 || digits.length === 14;
}

function getTodayDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDays(date, days) {
  const [year, month, day] = date.split("-").map(Number);
  const value = new Date(year, month - 1, day, 12, 0, 0);
  value.setDate(value.getDate() + days);
  const nextYear = value.getFullYear();
  const nextMonth = String(value.getMonth() + 1).padStart(2, "0");
  const nextDay = String(value.getDate()).padStart(2, "0");
  return `${nextYear}-${nextMonth}-${nextDay}`;
}

function isValidSubscriptionPlan(value) {
  return ["trial", "pro"].includes(value);
}

async function buildOrganizationAdminItem(row) {
  const billingAccess = await resolveOrganizationBillingAccess(row.id);
  const aggregate = await getOrganizationBillingAggregate(row.id);
  const hasBillingSubscription = Boolean(aggregate.subscription);
  const plan = hasBillingSubscription ? aggregate.plan : null;
  const transaction = aggregate.currentTransaction;

  return {
    id: row.id,
    nome_empresa: row.nome_empresa,
    email_responsavel: row.email_responsavel,
    telefone: row.telefone,
    monthly_amount: hasBillingSubscription
      ? Number(aggregate.subscription.amount_cents ?? plan?.price_cents ?? 0) / 100
      : Number(row.monthly_amount ?? 0),
    subscription_status: billingAccess.subscriptionStatus,
    subscription_plan: hasBillingSubscription ? plan?.code ?? row.subscription_plan : row.subscription_plan,
    billing_plan_name: plan?.name ?? null,
    billing_cycle: hasBillingSubscription ? aggregate.subscription.billing_cycle : null,
    billing_amount_cents: hasBillingSubscription
      ? Number(aggregate.subscription.amount_cents ?? plan?.price_cents ?? 0)
      : null,
    due_date: billingAccess.dueDate ?? row.due_date,
    trial_end: row.trial_end,
    is_blocked: billingAccess.isBlocked,
    block_reason: billingAccess.blockReason,
    can_access: billingAccess.canAccess,
    latest_payment_status: transaction?.status ?? row.latest_payment_status,
    billing_payment_method: transaction?.payment_method ?? null,
    latest_reference_month: row.latest_reference_month,
    active_users: row.active_users,
  };
}

function normalizeOrganizationInput(input) {
  return {
    nomeEmpresa: normalizeString(input.nome_empresa ?? input.nomeEmpresa),
    emailResponsavel: normalizeString(
      input.email_responsavel ?? input.emailResponsavel ?? input.owner_email ?? input.ownerEmail,
    ).toLowerCase(),
    telefone: normalizeString(input.telefone),
    cpfCnpj: normalizeDocument(input.cpf_cnpj ?? input.cpfCnpj),
    monthlyAmount: Number(input.monthly_amount ?? input.monthlyAmount ?? 0),
    subscriptionPlan: normalizeString(input.subscription_plan ?? input.subscriptionPlan) || "trial",
    subscriptionStatus: input.subscription_status ?? input.subscriptionStatus ?? null,
    dueDate: input.due_date ?? input.dueDate ?? null,
    trialEnd: input.trial_end ?? input.trialEnd ?? null,
    trialDays: Number(input.trial_days ?? input.trialDays ?? 5),
    ownerName:
      normalizeString(input.owner_name ?? input.ownerName ?? input.nome_responsavel ?? input.nomeResponsavel) ||
      "Responsavel",
    initialPassword: normalizeString(input.initial_password ?? input.initialPassword ?? input.senha_inicial),
  };
}

async function syncSubscriptionAfterPayment(organizationId, paymentInput) {
  const nextStatus =
    paymentInput.status === "paid"
      ? "active"
      : paymentInput.status === "overdue"
        ? "overdue"
        : paymentInput.status === "canceled"
          ? "canceled"
          : undefined;

  if (!nextStatus) {
    return;
  }

  await updateOrganizationById(organizationId, {
    subscription_status: nextStatus,
    due_date: paymentInput.due_date ?? undefined,
  });

  const billingSubscription = await getOrganizationSubscriptionByOrganizationId(organizationId);

  if (!billingSubscription) {
    return;
  }

  const now = new Date().toISOString();
  const billingStatus =
    paymentInput.status === "paid"
      ? "active"
      : paymentInput.status === "overdue"
        ? "past_due"
        : "cancelled";
  const isLocked = paymentInput.status === "canceled";

  await runBillingTransaction(async (connection) => {
    await updateOrganizationSubscription(
      billingSubscription.id,
      {
        status: billingStatus,
        next_due_date: paymentInput.due_date ?? undefined,
        grace_until: paymentInput.status === "paid" ? null : undefined,
        blocked_at: isLocked ? now : null,
        cancelled_at: isLocked ? now : null,
        reactivated_at: paymentInput.status === "paid" ? now : undefined,
        last_payment_at: paymentInput.status === "paid" ? now : undefined,
        last_status_change_at: now,
      },
      connection,
    );
    await upsertOrganizationAccessLock(
      organizationId,
      {
        is_locked: isLocked,
        lock_reason: isLocked ? "subscription_cancelled" : null,
        locked_at: isLocked ? now : null,
        unlocked_at: isLocked ? undefined : now,
        grace_until: paymentInput.status === "paid" ? null : undefined,
        related_subscription_id: billingSubscription.id,
        notes:
          paymentInput.status === "paid"
            ? "Acesso liberado apos registro manual de pagamento."
            : undefined,
      },
      connection,
    );
  });
}

export async function listOrganizationsForPlatformAdmin() {
  const organizations = await listAdminOrganizations();
  return Promise.all(organizations.map(buildOrganizationAdminItem));
}

export async function createOrganizationForPlatformAdmin(input) {
  const normalized = normalizeOrganizationInput(input);

  if (!normalized.nomeEmpresa) {
    const error = new Error("Nome da empresa e obrigatorio.");
    error.statusCode = 400;
    throw error;
  }

  if (!normalized.emailResponsavel || !isValidEmail(normalized.emailResponsavel)) {
    const error = new Error("Email do responsavel invalido.");
    error.statusCode = 400;
    throw error;
  }

  if (!isValidCpfCnpj(normalized.cpfCnpj)) {
    const error = new Error("CPF/CNPJ do assinante invalido.");
    error.statusCode = 400;
    throw error;
  }

  if (!Number.isFinite(normalized.monthlyAmount) || normalized.monthlyAmount < 0) {
    const error = new Error("Mensalidade invalida.");
    error.statusCode = 400;
    throw error;
  }

  if (!isValidSubscriptionPlan(normalized.subscriptionPlan)) {
    const error = new Error("Plano invalido. Use Trial ou Pro.");
    error.statusCode = 400;
    throw error;
  }

  if (!isValidPassword(normalized.initialPassword)) {
    const error = new Error("A senha inicial precisa ter pelo menos 8 caracteres.");
    error.statusCode = 400;
    throw error;
  }

  if (
    normalized.subscriptionStatus !== null &&
    normalized.subscriptionStatus !== undefined &&
    !isValidSubscriptionStatus(normalized.subscriptionStatus)
  ) {
    const error = new Error("Status de assinatura invalido.");
    error.statusCode = 400;
    throw error;
  }

  if (normalized.subscriptionPlan === "trial") {
    if (!Number.isInteger(normalized.trialDays) || normalized.trialDays < 1 || normalized.trialDays > 365) {
      const error = new Error("Informe uma quantidade valida de dias para o trial.");
      error.statusCode = 400;
      throw error;
    }
  }

  const today = getTodayDate();
  const computedTrialEnd =
    normalized.subscriptionPlan === "trial"
      ? normalized.trialEnd
        ? normalizeString(normalized.trialEnd)
        : addDays(today, normalized.trialDays)
      : null;
  const computedSubscriptionStatus =
    normalized.subscriptionPlan === "trial"
      ? "trial"
      : normalized.subscriptionStatus && normalized.subscriptionStatus !== "trial"
        ? normalized.subscriptionStatus
        : "active";

  const organization = await createOrganization({
    emailResponsavel: normalized.emailResponsavel,
    nomeEmpresa: normalized.nomeEmpresa,
    telefone: normalized.telefone,
    cpfCnpj: normalized.cpfCnpj,
    monthlyAmount: normalized.monthlyAmount,
    subscriptionPlan: normalized.subscriptionPlan,
    subscriptionStatus: computedSubscriptionStatus,
    dueDate: normalized.dueDate,
    trialEnd: computedTrialEnd,
  });

  await createUser({
    email: normalized.emailResponsavel,
    nome: normalized.ownerName,
    organizationId: organization.id,
    role: "owner",
    passwordHash: hashPassword(normalized.initialPassword),
  });

  return getOrganizationForPlatformAdmin(organization.id);
}

export async function getOrganizationForPlatformAdmin(organizationId) {
  const details = await getAdminOrganizationDetails(organizationId);

  if (!details) {
    const error = new Error("Organizacao nao encontrada.");
    error.statusCode = 404;
    throw error;
  }

  const billing = await buildOrganizationAdminItem(details.organization);

  return {
    organization: {
      ...details.organization,
      monthly_amount: billing.monthly_amount,
      subscription_status: billing.subscription_status,
      subscription_plan: billing.subscription_plan,
      billing_plan_name: billing.billing_plan_name,
      billing_cycle: billing.billing_cycle,
      billing_amount_cents: billing.billing_amount_cents,
      due_date: billing.due_date,
      is_blocked: billing.is_blocked,
      block_reason: billing.block_reason,
      can_access: billing.can_access,
      latest_payment_status: billing.latest_payment_status,
      billing_payment_method: billing.billing_payment_method,
    },
    settings: details.settings,
    members: details.members.map((member) => ({
      id: member.id,
      nome: member.nome,
      email: member.email,
      role: member.role,
      ativo: Boolean(member.ativo),
    })),
    payments: details.payments,
  };
}

export async function updateOrganizationSubscriptionForPlatformAdmin(organizationId, input) {
  const subscriptionStatus = input.subscription_status ?? input.subscriptionStatus;
  const subscriptionPlan = input.subscription_plan ?? input.subscriptionPlan;
  const dueDate = input.due_date ?? input.dueDate;
  const trialEnd = input.trial_end ?? input.trialEnd;
  const monthlyAmount = input.monthly_amount ?? input.monthlyAmount;

  if (subscriptionStatus !== undefined && !isValidSubscriptionStatus(subscriptionStatus)) {
    const error = new Error("Status de assinatura invalido.");
    error.statusCode = 400;
    throw error;
  }

  if (
    subscriptionPlan !== undefined &&
    normalizeString(subscriptionPlan) &&
    !isValidSubscriptionPlan(normalizeString(subscriptionPlan))
  ) {
    const error = new Error("Plano invalido. Use Trial ou Pro.");
    error.statusCode = 400;
    throw error;
  }

  if (dueDate !== undefined && dueDate !== null && !isValidDate(normalizeString(dueDate))) {
    const error = new Error("Data de vencimento invalida.");
    error.statusCode = 400;
    throw error;
  }

  if (trialEnd !== undefined && trialEnd !== null && !isValidDate(normalizeString(trialEnd))) {
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

  const organization = await updateOrganizationById(organizationId, {
    subscription_status: subscriptionStatus,
    subscription_plan: subscriptionPlan !== undefined ? normalizeString(subscriptionPlan) : undefined,
    monthly_amount: monthlyAmount !== undefined ? Number(monthlyAmount) : undefined,
    due_date: dueDate !== undefined ? normalizeString(dueDate) || null : undefined,
    trial_end: trialEnd !== undefined ? normalizeString(trialEnd) || null : undefined,
  });

  if (!organization) {
    const error = new Error("Organizacao nao encontrada.");
    error.statusCode = 404;
    throw error;
  }

  return getOrganizationForPlatformAdmin(organizationId);
}

export async function listPaymentsForPlatformAdmin(organizationId) {
  return listOrganizationPayments(organizationId);
}

export async function createPaymentForPlatformAdmin(organizationId, input) {
  const referenceMonth = input.reference_month ?? input.referenceMonth;
  const amount = Number(input.amount);
  const status = normalizeString(input.status);
  const dueDate = input.due_date ?? input.dueDate;
  const paidAt = input.paid_at ?? input.paidAt;

  if (!isValidReferenceMonth(normalizeString(referenceMonth))) {
    const error = new Error("Mes de referencia invalido. Use YYYY-MM.");
    error.statusCode = 400;
    throw error;
  }

  if (!Number.isFinite(amount) || amount < 0) {
    const error = new Error("Valor do pagamento invalido.");
    error.statusCode = 400;
    throw error;
  }

  if (!["pending", "paid", "overdue", "canceled"].includes(status)) {
    const error = new Error("Status do pagamento invalido.");
    error.statusCode = 400;
    throw error;
  }

  if (dueDate && !isValidDate(normalizeString(dueDate))) {
    const error = new Error("Data de vencimento invalida.");
    error.statusCode = 400;
    throw error;
  }

  if (paidAt && Number.isNaN(new Date(paidAt).getTime())) {
    const error = new Error("Data de pagamento invalida.");
    error.statusCode = 400;
    throw error;
  }

  const payment = await createOrganizationPayment(organizationId, {
    reference_month: normalizeString(referenceMonth),
    amount,
    status,
    due_date: dueDate ? normalizeString(dueDate) : null,
    paid_at: paidAt || null,
    payment_method: normalizeString(input.payment_method ?? input.paymentMethod) || null,
    notes: normalizeString(input.notes) || null,
  });

  await syncSubscriptionAfterPayment(organizationId, {
    status,
    due_date: dueDate ? normalizeString(dueDate) : null,
  });

  return payment;
}


export async function getPlatformSettingsForAdmin() {
  return getPlatformSettings();
}

export async function updatePlatformSettingsForAdmin(input) {
  const pixKey = normalizeString(input.pix_key ?? input.pixKey);
  const adminWhatsappNumber = normalizeString(
    input.admin_whatsapp_number ?? input.adminWhatsappNumber,
  );
  const defaultTrialDays = Number(input.default_trial_days ?? input.defaultTrialDays ?? 5);
  const paymentGraceDays = Number(input.payment_grace_days ?? input.paymentGraceDays ?? 5);
  const paymentAlertDays = Number(input.payment_alert_days ?? input.paymentAlertDays ?? 5);

  if (!Number.isInteger(defaultTrialDays) || defaultTrialDays < 1 || defaultTrialDays > 365) {
    const error = new Error("Dias padrao de trial invalidos. Use entre 1 e 365 dias.");
    error.statusCode = 400;
    throw error;
  }

  if (!Number.isInteger(paymentGraceDays) || paymentGraceDays < 0 || paymentGraceDays > 60) {
    const error = new Error("Folga de pagamento invalida. Use entre 0 e 60 dias.");
    error.statusCode = 400;
    throw error;
  }

  if (!Number.isInteger(paymentAlertDays) || paymentAlertDays < 0 || paymentAlertDays > 60) {
    const error = new Error("Janela de alerta invalida. Use entre 0 e 60 dias.");
    error.statusCode = 400;
    throw error;
  }

  return updatePlatformSettings({
    pix_key: pixKey,
    admin_whatsapp_number: adminWhatsappNumber,
    default_trial_days: defaultTrialDays,
    payment_grace_days: paymentGraceDays,
    payment_alert_days: paymentAlertDays,
  });
}
