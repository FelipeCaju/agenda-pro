import { apiClient } from "@/services/apiClient";
import { executeServiceCall } from "@/services/serviceHelpers";

export type BillingSubscriptionStatus =
  | "trialing"
  | "pending_payment"
  | "active"
  | "past_due"
  | "cancelled"
  | "expired"
  | "blocked";

export type BillingChargeStatus =
  | "pending"
  | "received"
  | "confirmed"
  | "overdue"
  | "refunded"
  | "failed"
  | "cancelled";

type BillingPlanApiModel = {
  id: string;
  name: string;
  code: string;
  description: string | null;
  price_cents: number;
  currency: string;
  billing_cycle: string;
  trial_days: number;
  grace_days: number;
};

type BillingSubscriptionApiModel = {
  id: string;
  status: BillingSubscriptionStatus;
  billing_cycle: string;
  amount_cents: number;
  currency: string;
  gateway_customer_id: string | null;
  gateway_subscription_id: string | null;
  next_due_date: string | null;
  grace_until: string | null;
  trial_starts_at: string | null;
  trial_ends_at: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  cancelled_at: string | null;
  expired_at: string | null;
  blocked_at: string | null;
  reactivated_at: string | null;
  last_payment_at: string | null;
};

type BillingAccessApiModel = {
  subscription_status: BillingSubscriptionStatus;
  can_access: boolean;
  is_blocked: boolean;
  block_reason: string | null;
  due_date: string | null;
  grace_until: string | null;
  payment_notice_visible: boolean;
  alert_window_days?: number;
  trial_ends_at: string | null;
};

type BillingChargeApiModel = {
  id: string;
  status: BillingChargeStatus;
  payment_method: "pix" | "credit_card" | "boleto" | "unknown";
  amount_cents: number;
  due_date: string | null;
  paid_at: string | null;
  confirmed_at: string | null;
  invoice_url: string | null;
  bank_slip_url: string | null;
  pix_qr_code_text: string | null;
  pix_qr_code_image_url: string | null;
  description: string | null;
  external_reference: string | null;
  created_at: string | null;
};

type BillingOverviewApiModel = {
  organization_id: string | null;
  plan: BillingPlanApiModel | null;
  subscription: BillingSubscriptionApiModel | null;
  access: BillingAccessApiModel;
  current_charge: BillingChargeApiModel | null;
  checkout?: {
    started: boolean;
    reused_existing_subscription: boolean;
  };
};

type HostedCardCheckoutApiModel = {
  checkout_id: string | null;
  checkout_url: string | null;
  payment_method: "credit_card";
};

export type BillingPlan = {
  id: string;
  name: string;
  code: string;
  description: string | null;
  priceCents: number;
  currency: string;
  billingCycle: string;
  trialDays: number;
  graceDays: number;
};

export type BillingSubscription = {
  id: string;
  status: BillingSubscriptionStatus;
  billingCycle: string;
  amountCents: number;
  currency: string;
  gatewayCustomerId: string | null;
  gatewaySubscriptionId: string | null;
  nextDueDate: string | null;
  graceUntil: string | null;
  trialStartsAt: string | null;
  trialEndsAt: string | null;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  cancelledAt: string | null;
  expiredAt: string | null;
  blockedAt: string | null;
  reactivatedAt: string | null;
  lastPaymentAt: string | null;
};

export type BillingAccess = {
  subscriptionStatus: BillingSubscriptionStatus;
  canAccess: boolean;
  isBlocked: boolean;
  blockReason: string | null;
  dueDate: string | null;
  graceUntil: string | null;
  paymentNoticeVisible: boolean;
  alertWindowDays: number;
  trialEndsAt: string | null;
};

export type BillingCharge = {
  id: string;
  status: BillingChargeStatus;
  paymentMethod: "pix" | "credit_card" | "boleto" | "unknown";
  amountCents: number;
  dueDate: string | null;
  paidAt: string | null;
  confirmedAt: string | null;
  invoiceUrl: string | null;
  bankSlipUrl: string | null;
  pixQrCodeText: string | null;
  pixQrCodeImageUrl: string | null;
  description: string | null;
  externalReference: string | null;
  createdAt: string | null;
};

export type BillingOverview = {
  organizationId: string | null;
  plan: BillingPlan | null;
  subscription: BillingSubscription | null;
  access: BillingAccess;
  currentCharge: BillingCharge | null;
  checkout?: {
    started: boolean;
    reusedExistingSubscription: boolean;
  };
};

export type HostedCardCheckoutSession = {
  checkoutId: string | null;
  checkoutUrl: string | null;
  paymentMethod: "credit_card";
};

function mapPlan(model: BillingPlanApiModel | null): BillingPlan | null {
  if (!model) {
    return null;
  }

  return {
    id: model.id,
    name: model.name,
    code: model.code,
    description: model.description,
    priceCents: Number(model.price_cents ?? 0),
    currency: model.currency,
    billingCycle: model.billing_cycle,
    trialDays: Number(model.trial_days ?? 0),
    graceDays: Number(model.grace_days ?? 0),
  };
}

function mapSubscription(model: BillingSubscriptionApiModel | null): BillingSubscription | null {
  if (!model) {
    return null;
  }

  return {
    id: model.id,
    status: model.status,
    billingCycle: model.billing_cycle,
    amountCents: Number(model.amount_cents ?? 0),
    currency: model.currency,
    gatewayCustomerId: model.gateway_customer_id,
    gatewaySubscriptionId: model.gateway_subscription_id,
    nextDueDate: model.next_due_date,
    graceUntil: model.grace_until,
    trialStartsAt: model.trial_starts_at,
    trialEndsAt: model.trial_ends_at,
    currentPeriodStart: model.current_period_start,
    currentPeriodEnd: model.current_period_end,
    cancelAtPeriodEnd: Boolean(model.cancel_at_period_end),
    cancelledAt: model.cancelled_at,
    expiredAt: model.expired_at,
    blockedAt: model.blocked_at,
    reactivatedAt: model.reactivated_at,
    lastPaymentAt: model.last_payment_at,
  };
}

function mapAccess(model: BillingAccessApiModel): BillingAccess {
  return {
    subscriptionStatus: model.subscription_status,
    canAccess: Boolean(model.can_access),
    isBlocked: Boolean(model.is_blocked),
    blockReason: model.block_reason,
    dueDate: model.due_date,
    graceUntil: model.grace_until,
    paymentNoticeVisible: Boolean(model.payment_notice_visible),
    alertWindowDays: Number(model.alert_window_days ?? 5),
    trialEndsAt: model.trial_ends_at,
  };
}

function mapCharge(model: BillingChargeApiModel | null): BillingCharge | null {
  if (!model) {
    return null;
  }

  return {
    id: model.id,
    status: model.status,
    paymentMethod: model.payment_method,
    amountCents: Number(model.amount_cents ?? 0),
    dueDate: model.due_date,
    paidAt: model.paid_at,
    confirmedAt: model.confirmed_at,
    invoiceUrl: model.invoice_url,
    bankSlipUrl: model.bank_slip_url,
    pixQrCodeText: model.pix_qr_code_text,
    pixQrCodeImageUrl: model.pix_qr_code_image_url,
    description: model.description,
    externalReference: model.external_reference,
    createdAt: model.created_at,
  };
}

function mapOverview(model: BillingOverviewApiModel): BillingOverview {
  return {
    organizationId: model.organization_id,
    plan: mapPlan(model.plan),
    subscription: mapSubscription(model.subscription),
    access: mapAccess(model.access),
    currentCharge: mapCharge(model.current_charge),
    checkout: model.checkout
      ? {
          started: Boolean(model.checkout.started),
          reusedExistingSubscription: Boolean(model.checkout.reused_existing_subscription),
        }
      : undefined,
  };
}

export const billingService = {
  async getOverview() {
    return executeServiceCall(
      async () => {
        const response = await apiClient.get<BillingOverviewApiModel>("/billing/overview");
        return mapOverview(response.data);
      },
      {
        errorMessage: "Nao foi possivel carregar o billing.",
      },
    );
  },
  async getSubscription() {
    return executeServiceCall(
      async () => {
        const response = await apiClient.get<{
          plan: BillingPlanApiModel | null;
          subscription: BillingSubscriptionApiModel | null;
          access: BillingAccessApiModel;
        }>("/billing/subscription");
        return {
          plan: mapPlan(response.data.plan),
          subscription: mapSubscription(response.data.subscription),
          access: mapAccess(response.data.access),
        };
      },
      {
        errorMessage: "Nao foi possivel carregar a assinatura.",
      },
    );
  },
  async startCheckout() {
    return executeServiceCall(
      async () => {
        const response = await apiClient.post<BillingOverviewApiModel>("/billing/checkout/start");
        return mapOverview(response.data);
      },
      {
        errorMessage: "Nao foi possivel iniciar o checkout.",
      },
    );
  },
  async startCardCheckout() {
    return executeServiceCall(
      async () => {
        const response = await apiClient.post<HostedCardCheckoutApiModel>("/billing/checkout/card");
        return {
          checkoutId: response.data.checkout_id,
          checkoutUrl: response.data.checkout_url,
          paymentMethod: response.data.payment_method,
        } satisfies HostedCardCheckoutSession;
      },
      {
        errorMessage: "Nao foi possivel iniciar o checkout com cartao.",
      },
    );
  },
  async cancelSubscription() {
    return executeServiceCall(
      async () => {
        const response = await apiClient.post<{
          plan: BillingPlanApiModel | null;
          subscription: BillingSubscriptionApiModel | null;
          access: BillingAccessApiModel;
        }>("/billing/subscription/cancel");
        return {
          plan: mapPlan(response.data.plan),
          subscription: mapSubscription(response.data.subscription),
          access: mapAccess(response.data.access),
        };
      },
      {
        errorMessage: "Nao foi possivel cancelar a assinatura.",
      },
    );
  },
  async reactivateSubscription() {
    return executeServiceCall(
      async () => {
        const response = await apiClient.post<BillingOverviewApiModel>("/billing/subscription/reactivate");
        return mapOverview(response.data);
      },
      {
        errorMessage: "Nao foi possivel reativar a assinatura.",
      },
    );
  },
  async listInvoices() {
    return executeServiceCall(
      async () => {
        const response = await apiClient.get<BillingChargeApiModel[]>("/billing/invoices");
        return response.data.map(mapCharge).filter(Boolean) as BillingCharge[];
      },
      {
        errorMessage: "Nao foi possivel carregar as faturas.",
      },
    );
  },
  async getCurrentCharge() {
    return executeServiceCall(
      async () => {
        const response = await apiClient.get<BillingChargeApiModel | null>("/billing/current-charge");
        return mapCharge(response.data);
      },
      {
        errorMessage: "Nao foi possivel carregar a cobranca atual.",
      },
    );
  },
};
