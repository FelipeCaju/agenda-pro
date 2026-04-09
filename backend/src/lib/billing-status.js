const BILLING_STATUSES = [
  "trialing",
  "pending_payment",
  "active",
  "past_due",
  "cancelled",
  "expired",
  "blocked",
];

const BILLING_TRANSACTION_STATUSES = [
  "pending",
  "received",
  "confirmed",
  "overdue",
  "refunded",
  "failed",
  "cancelled",
];

export const BILLING_GRACE_DAYS = 3;
export const DEFAULT_PLAN_CODE = "agenda_pro_mensal";
export const DEFAULT_PLAN_PRICE_CENTS = 2990;
export const DEFAULT_PLAN_NAME = "AgendaPro Mensal";
export const DEFAULT_CURRENCY = "BRL";
export const DEFAULT_GATEWAY = "asaas";
export const DEFAULT_BILLING_CYCLE = "monthly";

export function normalizeBillingStatus(value) {
  return BILLING_STATUSES.includes(value) ? value : "pending_payment";
}

export function normalizeBillingTransactionStatus(value) {
  return BILLING_TRANSACTION_STATUSES.includes(value) ? value : "pending";
}

export function normalizeBillingCycle(value) {
  return ["monthly", "quarterly", "semiannual", "annual"].includes(value) ? value : "monthly";
}

export function normalizePaymentMethod(value) {
  return ["pix", "credit_card", "boleto", "unknown"].includes(value) ? value : "unknown";
}

export function formatDateTimeForDatabase(value) {
  if (!value) {
    return null;
  }

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toISOString().slice(0, 19).replace("T", " ");
}

export function formatDateForDatabase(value) {
  if (!value) {
    return null;
  }

  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toISOString().slice(0, 10);
}

export function startOfToday() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0);
}

export function addDays(dateValue, days) {
  const date = dateValue instanceof Date ? new Date(dateValue) : new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  date.setDate(date.getDate() + Number(days ?? 0));
  return date;
}

export function toIsoDate(value) {
  return formatDateForDatabase(value);
}

export function toIsoDateTime(value) {
  if (!value) {
    return null;
  }

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toISOString();
}

export function mapAsaasBillingType(value) {
  if (value === "PIX") {
    return "pix";
  }

  if (value === "BOLETO") {
    return "boleto";
  }

  if (value === "CREDIT_CARD" || value === "DEBIT_CARD") {
    return "credit_card";
  }

  return "unknown";
}

export function mapAsaasPaymentStatus(value) {
  switch (value) {
    case "RECEIVED":
      return "received";
    case "CONFIRMED":
    case "RECEIVED_IN_CASH":
      return "confirmed";
    case "OVERDUE":
      return "overdue";
    case "REFUNDED":
    case "PARTIALLY_REFUNDED":
    case "REFUND_REQUESTED":
      return "refunded";
    case "DELETED":
    case "CANCELED":
      return "cancelled";
    case "PENDING":
    case "AWAITING_RISK_ANALYSIS":
      return "pending";
    default:
      return "failed";
  }
}

export function computeGraceUntil(dueDate, graceDays = BILLING_GRACE_DAYS) {
  const baseDate = dueDate ? new Date(`${dueDate}T12:00:00`) : null;

  if (!baseDate || Number.isNaN(baseDate.getTime())) {
    return null;
  }

  const graceUntil = addDays(baseDate, graceDays);
  return toIsoDateTime(graceUntil);
}

export function mapLegacySubscriptionStatus(snapshot) {
  if (!snapshot) {
    return "trial";
  }

  if (snapshot.subscription_status === "trialing") {
    return "trial";
  }

  if (snapshot.subscription_status === "active") {
    return "active";
  }

  if (snapshot.subscription_status === "cancelled") {
    return "canceled";
  }

  if (snapshot.subscription_status === "pending_payment" || snapshot.subscription_status === "past_due") {
    return "overdue";
  }

  if (snapshot.subscription_status === "expired" || snapshot.subscription_status === "blocked") {
    return "blocked";
  }

  return "trial";
}

export function buildBillingAccessSnapshot({
  organization = null,
  subscription = null,
  currentTransaction = null,
  accessLock = null,
}) {
  const today = toIsoDate(startOfToday());
  const currentChargeDueDate = currentTransaction?.due_date ?? currentTransaction?.dueDate ?? null;

  if (!subscription) {
    return {
      subscriptionStatus: organization?.subscription_status ?? "trial",
      canAccess: Boolean(organization),
      isBlocked: false,
      blockReason: null,
      trialEndsAt: organization?.trial_end ?? null,
      dueDate: organization?.due_date ?? null,
      graceUntil: null,
      currentChargeStatus: null,
      paymentNoticeVisible: false,
      legacyStatus: organization?.subscription_status ?? "trial",
    };
  }

  const dueDate = subscription.next_due_date ?? currentTransaction?.due_date ?? null;
  const graceUntil =
    subscription.grace_until ??
    accessLock?.grace_until ??
    computeGraceUntil(dueDate, BILLING_GRACE_DAYS);
  const chargeStatus = currentTransaction?.status ?? null;
  const trialEndsAt = subscription.trial_ends_at ?? null;
  const rawStatus = normalizeBillingStatus(subscription.status);
  const lockIsActive = Boolean(accessLock?.is_locked);

  if (lockIsActive || rawStatus === "blocked") {
    return {
      subscriptionStatus: "blocked",
      canAccess: false,
      isBlocked: true,
      blockReason: accessLock?.lock_reason ?? "subscription_blocked",
      trialEndsAt,
      dueDate,
      graceUntil,
      currentChargeStatus: chargeStatus,
      paymentNoticeVisible: true,
      legacyStatus: "blocked",
    };
  }

  if (rawStatus === "cancelled") {
    return {
      subscriptionStatus: rawStatus,
      canAccess: false,
      isBlocked: true,
      blockReason: "subscription_cancelled",
      trialEndsAt,
      dueDate,
      graceUntil,
      currentChargeStatus: chargeStatus,
      paymentNoticeVisible: false,
      legacyStatus: "canceled",
    };
  }

  if (rawStatus === "expired") {
    return {
      subscriptionStatus: rawStatus,
      canAccess: false,
      isBlocked: true,
      blockReason: "subscription_expired",
      trialEndsAt,
      dueDate,
      graceUntil,
      currentChargeStatus: chargeStatus,
      paymentNoticeVisible: true,
      legacyStatus: "blocked",
    };
  }

  if (rawStatus === "trialing") {
    const isTrialValid = Boolean(trialEndsAt && toIsoDate(trialEndsAt) >= today);

    return {
      subscriptionStatus: rawStatus,
      canAccess: isTrialValid,
      isBlocked: !isTrialValid,
      blockReason: isTrialValid ? null : "trial_expired",
      trialEndsAt,
      dueDate,
      graceUntil,
      currentChargeStatus: chargeStatus,
      paymentNoticeVisible: !isTrialValid,
      legacyStatus: "trial",
    };
  }

  if (rawStatus === "pending_payment") {
    return {
      subscriptionStatus: rawStatus,
      canAccess: false,
      isBlocked: true,
      blockReason: "payment_required",
      trialEndsAt,
      dueDate: currentChargeDueDate ?? dueDate,
      graceUntil,
      currentChargeStatus: chargeStatus,
      paymentNoticeVisible: true,
      legacyStatus: "overdue",
    };
  }

  if (rawStatus === "past_due") {
    const isInsideGraceWindow = Boolean(graceUntil && toIsoDate(graceUntil) >= today);

    return {
      subscriptionStatus: isInsideGraceWindow ? "past_due" : "blocked",
      canAccess: isInsideGraceWindow,
      isBlocked: !isInsideGraceWindow,
      blockReason: "payment_overdue",
      trialEndsAt,
      dueDate: currentChargeDueDate ?? dueDate,
      graceUntil,
      currentChargeStatus: chargeStatus ?? "overdue",
      paymentNoticeVisible: true,
      legacyStatus: isInsideGraceWindow ? "overdue" : "blocked",
    };
  }

  return {
    subscriptionStatus: "active",
    canAccess: true,
    isBlocked: false,
    blockReason: null,
    trialEndsAt,
    dueDate: currentChargeDueDate ?? dueDate,
    graceUntil: chargeStatus === "overdue" ? graceUntil : null,
    currentChargeStatus: chargeStatus,
    paymentNoticeVisible: Boolean(chargeStatus === "pending" || chargeStatus === "overdue"),
    legacyStatus: "active",
  };
}
