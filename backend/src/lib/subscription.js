const ACTIVE_STATUSES = ["active"];
const BLOCKED_STATUSES = ["overdue", "blocked", "canceled"];
const TRIAL_STATUS = "trial";
const VALID_STATUSES = [...ACTIVE_STATUSES, ...BLOCKED_STATUSES, TRIAL_STATUS];

function normalizeDate(value) {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null;
}

function getTodayDate() {
  return new Date().toISOString().slice(0, 10);
}

export function isValidSubscriptionStatus(value) {
  return VALID_STATUSES.includes(value);
}

export function evaluateSubscriptionAccess(organization) {
  const subscriptionStatus = isValidSubscriptionStatus(organization?.subscription_status)
    ? organization.subscription_status
    : "blocked";
  const trialEnd = normalizeDate(organization?.trial_end);
  const today = getTodayDate();

  if (ACTIVE_STATUSES.includes(subscriptionStatus)) {
    return {
      subscriptionStatus,
      canAccess: true,
      isBlocked: false,
      blockReason: null,
      isTrialValid: false,
    };
  }

  if (subscriptionStatus === TRIAL_STATUS) {
    const isTrialValid = Boolean(trialEnd && trialEnd >= today);

    return {
      subscriptionStatus,
      canAccess: isTrialValid,
      isBlocked: !isTrialValid,
      blockReason: isTrialValid ? null : "trial_expired",
      isTrialValid,
    };
  }

  return {
    subscriptionStatus,
    canAccess: false,
    isBlocked: true,
    blockReason:
      subscriptionStatus === "overdue"
        ? "payment_overdue"
        : subscriptionStatus === "canceled"
          ? "subscription_canceled"
          : "subscription_blocked",
    isTrialValid: false,
  };
}
