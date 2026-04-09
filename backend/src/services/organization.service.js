import {
  getOrganizationById,
  listOrganizationPayments,
  listUsersByOrganization,
  updateOrganizationById,
} from "../lib/data.js";
import { getOrganizationBillingAggregate } from "../repositories/billing.repository.js";
import { isValidSubscriptionStatus } from "../lib/subscription.js";
import { resolveOrganizationBillingAccess } from "./billing.service.js";

function normalizeString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function normalizeDocument(value) {
  return String(value ?? "").replace(/\D+/g, "").trim();
}

function isValidCpfCnpj(value) {
  const digits = normalizeDocument(value);
  return !digits || digits.length === 11 || digits.length === 14;
}

function isValidPostalCode(value) {
  const digits = normalizeDocument(value);
  return !digits || digits.length === 8;
}

function isValidCityIbge(value) {
  const digits = normalizeDocument(value);
  return !digits || digits.length === 7;
}

async function buildOrganizationPayload(organization) {
  const [aggregate, access] = await Promise.all([
    getOrganizationBillingAggregate(organization.id),
    resolveOrganizationBillingAccess(organization.id),
  ]);
  const latestPayment = aggregate.currentTransaction;

  return {
    id: organization.id,
    nome_empresa: organization.nome_empresa,
    email_responsavel: organization.email_responsavel,
    telefone: organization.telefone,
    cpf_cnpj: organization.cpf_cnpj ?? null,
    billing_address: organization.billing_address ?? null,
    billing_address_number: organization.billing_address_number ?? null,
    billing_address_complement: organization.billing_address_complement ?? null,
    billing_postal_code: organization.billing_postal_code ?? null,
    billing_province: organization.billing_province ?? null,
    billing_city_ibge: organization.billing_city_ibge ?? null,
    monthly_amount: Number(organization.monthly_amount ?? 0),
    subscription_status: access.subscriptionStatus,
    subscription_plan: organization.subscription_plan,
    due_date: access.dueDate ?? organization.due_date,
    trial_end: access.trialEndsAt ?? organization.trial_end,
    is_blocked: access.isBlocked,
    block_reason: access.blockReason,
    can_access: access.canAccess,
    is_trial_valid: access.subscriptionStatus === "trialing",
    pix_key: latestPayment?.pix_qr_code_text ?? "",
    payment_grace_days: 3,
    payment_alert_days: 3,
    grace_until: access.graceUntil,
    latest_payment_id: latestPayment?.id ?? null,
    latest_payment_status: latestPayment?.status ?? null,
    latest_reference_month: latestPayment?.due_date ? String(latestPayment.due_date).slice(0, 7) : null,
    latest_payment_amount:
      latestPayment?.amount_cents !== undefined
        ? Number(latestPayment.amount_cents ?? 0) / 100
        : Number(organization.monthly_amount ?? 0),
    payment_notice_visible: access.paymentNoticeVisible,
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
  const cpfCnpj = input.cpf_cnpj ?? input.cpfCnpj;
  const billingAddress = input.billing_address ?? input.billingAddress;
  const billingAddressNumber = input.billing_address_number ?? input.billingAddressNumber;
  const billingAddressComplement = input.billing_address_complement ?? input.billingAddressComplement;
  const billingPostalCode = input.billing_postal_code ?? input.billingPostalCode;
  const billingProvince = input.billing_province ?? input.billingProvince;
  const billingCityIbge = input.billing_city_ibge ?? input.billingCityIbge;
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

  if (cpfCnpj !== undefined && !isValidCpfCnpj(cpfCnpj)) {
    const error = new Error("CPF/CNPJ invalido.");
    error.statusCode = 400;
    throw error;
  }

  if (billingPostalCode !== undefined && !isValidPostalCode(billingPostalCode)) {
    const error = new Error("CEP invalido.");
    error.statusCode = 400;
    throw error;
  }

  if (billingCityIbge !== undefined && !isValidCityIbge(billingCityIbge)) {
    const error = new Error("Codigo IBGE da cidade invalido.");
    error.statusCode = 400;
    throw error;
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
    cpf_cnpj: cpfCnpj !== undefined ? normalizeDocument(cpfCnpj) || null : undefined,
    billing_address: billingAddress !== undefined ? normalizeString(billingAddress) || null : undefined,
    billing_address_number:
      billingAddressNumber !== undefined ? normalizeString(billingAddressNumber) || null : undefined,
    billing_address_complement:
      billingAddressComplement !== undefined ? normalizeString(billingAddressComplement) || null : undefined,
    billing_postal_code:
      billingPostalCode !== undefined ? normalizeDocument(billingPostalCode) || null : undefined,
    billing_province: billingProvince !== undefined ? normalizeString(billingProvince) || null : undefined,
    billing_city_ibge:
      billingCityIbge !== undefined ? normalizeDocument(billingCityIbge) || null : undefined,
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
  const error = new Error(
    "O fluxo manual de aviso de pagamento foi substituido pelo webhook do billing. Aguarde a confirmacao automatica do gateway.",
  );
  error.statusCode = 409;
  throw error;
}
