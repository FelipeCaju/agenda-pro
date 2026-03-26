const ACTIVE_STATUSES = ["active"];
const BLOCKED_STATUSES = ["blocked", "canceled"];
const TRIAL_STATUS = "trial";
const VALID_STATUSES = [...ACTIVE_STATUSES, "overdue", ...BLOCKED_STATUSES, TRIAL_STATUS];

function normalizeDate(value) {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null;
}

function getTodayDate() {
  return new Date().toISOString().slice(0, 10);
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

function getGraceDays(platformSettings) {
  const value = Number(platformSettings?.payment_grace_days ?? 5);
  return Number.isFinite(value) && value >= 0 ? value : 5;
}

function getAlertDays(platformSettings) {
  const value = Number(platformSettings?.payment_alert_days ?? 5);
  return Number.isFinite(value) && value >= 0 ? value : 5;
}

export function isValidSubscriptionStatus(value) {
  return VALID_STATUSES.includes(value);
}

export function evaluateSubscriptionAccess(organization, latestPayment = null, platformSettings = null) {
  const rawStatus = isValidSubscriptionStatus(organization?.subscription_status)
    ? organization.subscription_status
    : "blocked";
  const trialEnd = normalizeDate(organization?.trial_end);
  const dueDate = normalizeDate(organization?.due_date ?? latestPayment?.due_date ?? null);
  const today = getTodayDate();
  const graceDays = getGraceDays(platformSettings);
  const alertDays = getAlertDays(platformSettings);
  const graceUntil = dueDate ? addDays(dueDate, graceDays) : null;
  const latestPaymentStatus = latestPayment?.status ?? null;
  const shouldShowPaymentNotice = Boolean(
    latestPaymentStatus === "pending" ||
      latestPaymentStatus === "overdue" ||
      (dueDate && dueDate <= addDays(today, alertDays)),
  );

  if (BLOCKED_STATUSES.includes(rawStatus)) {
    return {
      subscriptionStatus: rawStatus,
      canAccess: false,
      isBlocked: true,
      blockReason: rawStatus === "canceled" ? "subscription_canceled" : "subscription_blocked",
      isTrialValid: false,
      graceUntil,
      dueDate,
      graceDays,
      alertDays,
      latestPaymentStatus,
      shouldShowPaymentNotice,
    };
  }

  if (rawStatus === TRIAL_STATUS) {
    const isTrialValid = Boolean(trialEnd && trialEnd >= today);

    return {
      subscriptionStatus: rawStatus,
      canAccess: isTrialValid,
      isBlocked: !isTrialValid,
      blockReason: isTrialValid ? null : "trial_expired",
      isTrialValid,
      graceUntil,
      dueDate,
      graceDays,
      alertDays,
      latestPaymentStatus,
      shouldShowPaymentNotice,
    };
  }

  if (dueDate && today > dueDate) {
    const isInsideGraceWindow = Boolean(graceUntil && today <= graceUntil);

    return {
      subscriptionStatus: isInsideGraceWindow ? "overdue" : "blocked",
      canAccess: isInsideGraceWindow,
      isBlocked: !isInsideGraceWindow,
      blockReason: "payment_overdue",
      isTrialValid: false,
      graceUntil,
      dueDate,
      graceDays,
      alertDays,
      latestPaymentStatus,
      shouldShowPaymentNotice: true,
    };
  }

  return {
    subscriptionStatus: latestPaymentStatus === "pending" ? "overdue" : rawStatus,
    canAccess: true,
    isBlocked: false,
    blockReason: null,
    isTrialValid: false,
    graceUntil,
    dueDate,
    graceDays,
    alertDays,
    latestPaymentStatus,
    shouldShowPaymentNotice,
  };
}
