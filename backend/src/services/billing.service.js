import {
  BILLING_GRACE_DAYS,
  DEFAULT_GATEWAY,
  buildBillingAccessSnapshot,
  computeGraceUntil,
  formatDateForDatabase,
  mapAsaasBillingType,
  mapAsaasPaymentStatus,
  toIsoDateTime,
} from "../lib/billing-status.js";
import { evaluateSubscriptionAccess } from "../lib/subscription.js";
import { getLatestOrganizationPayment, getPlatformSettings } from "../lib/data.js";
import {
  createAsaasCustomer,
  createAsaasSubscription,
  cancelAsaasSubscription,
  getAsaasPixQrCode,
  getAsaasWebhookToken,
  listAsaasSubscriptionPayments,
} from "./asaas.service.js";
import {
  createOrUpdateBillingTransaction,
  createOrganizationSubscription,
  createWebhookEventLog,
  ensureBillingInfrastructure,
  findBillingTransactionByGatewayPaymentId,
  getBillingOrganizationSummary,
  getCurrentBillingTransactionBySubscriptionId,
  getOrganizationAccessLock,
  getOrganizationBillingAggregate,
  getOrganizationSubscriptionByGatewaySubscriptionId,
  getOrganizationSubscriptionByOrganizationId,
  getSubscriptionPlanByCode,
  listBillingTransactionsByOrganizationId,
  runBillingTransaction,
  updateOrganizationBillingCache,
  updateOrganizationSubscription,
  updateWebhookEventLog,
  upsertOrganizationAccessLock,
} from "../repositories/billing.repository.js";

function getTodayDate() {
  return new Date().toISOString().slice(0, 10);
}

function getNowIsoDateTime() {
  return new Date().toISOString();
}

function formatCurrencyCentsToValue(cents) {
  return Number(cents ?? 0) / 100;
}

function buildCheckoutExternalReference(organizationId) {
  return `agendapro:${organizationId}`;
}

function mapCycleToAsaas(value) {
  if (value === "quarterly") return "QUARTERLY";
  if (value === "semiannual") return "SEMIANNUALLY";
  if (value === "annual") return "YEARLY";
  return "MONTHLY";
}

function mapAsaasPaymentToTransactionInput(payment, context = {}) {
  return {
    organization_id: context.organization_id,
    subscription_id: context.subscription_id,
    plan_id: context.plan_id,
    gateway: DEFAULT_GATEWAY,
    gateway_payment_id: payment.id,
    gateway_invoice_id: payment.invoiceNumber ?? null,
    gateway_charge_id: payment.ourNumber ?? null,
    gateway_event_reference: context.gateway_event_reference ?? null,
    transaction_type: "subscription",
    payment_method: mapAsaasBillingType(payment.billingType),
    status: mapAsaasPaymentStatus(payment.status),
    description: payment.description ?? context.description ?? null,
    amount_cents: Math.round(Number(payment.value ?? 0) * 100),
    net_amount_cents:
      payment.netValue === undefined || payment.netValue === null
        ? null
        : Math.round(Number(payment.netValue) * 100),
    fee_cents:
      payment.netValue === undefined || payment.netValue === null
        ? null
        : Math.max(
            0,
            Math.round(Number(payment.value ?? 0) * 100) - Math.round(Number(payment.netValue) * 100),
          ),
    currency: "BRL",
    installment_count: Number(payment.installmentCount ?? 1),
    due_date: payment.dueDate ?? null,
    paid_at: payment.clientPaymentDate ?? payment.paymentDate ?? null,
    confirmed_at: payment.confirmedDate ?? null,
    overdue_at: mapAsaasPaymentStatus(payment.status) === "overdue" ? getNowIsoDateTime() : null,
    refunded_at: payment.refundedDate ?? null,
    cancelled_at:
      mapAsaasPaymentStatus(payment.status) === "cancelled" ? getNowIsoDateTime() : null,
    invoice_url: payment.invoiceUrl ?? null,
    bank_slip_url: payment.bankSlipUrl ?? null,
    card_brand: payment.creditCard?.creditCardBrand ?? null,
    card_last4: payment.creditCard?.creditCardNumber?.slice(-4) ?? null,
    external_reference: payment.externalReference ?? context.external_reference ?? null,
    metadata_text: JSON.stringify(payment),
  };
}

async function getLegacyAccessSnapshot(organization) {
  const latestPayment = organization ? await getLatestOrganizationPayment(organization.id) : null;
  const platformSettings = organization ? await getPlatformSettings() : null;
  return evaluateSubscriptionAccess(organization, latestPayment, platformSettings);
}

async function refreshAsaasPayments(subscription, plan) {
  if (!subscription?.gateway_subscription_id) {
    return [];
  }

  const payments = await listAsaasSubscriptionPayments(subscription.gateway_subscription_id);
  const localTransactions = [];

  for (const payment of payments) {
    const transaction = await createOrUpdateBillingTransaction(
      mapAsaasPaymentToTransactionInput(payment, {
        organization_id: subscription.organization_id,
        subscription_id: subscription.id,
        plan_id: plan.id,
        description: plan.name,
        external_reference: buildCheckoutExternalReference(subscription.organization_id),
      }),
    );

    localTransactions.push(transaction);
  }

  return localTransactions;
}

async function enrichTransactionWithPix(transaction) {
  if (!transaction?.gateway_payment_id || transaction.payment_method !== "pix") {
    return transaction;
  }

  if (transaction.pix_qr_code_text && transaction.pix_qr_code_image_url) {
    return transaction;
  }

  const pixData = await getAsaasPixQrCode(transaction.gateway_payment_id);

  if (!pixData) {
    return transaction;
  }

  return createOrUpdateBillingTransaction({
    gateway_payment_id: transaction.gateway_payment_id,
    pix_qr_code_text:
      pixData.payload ?? pixData.encodedImage ?? pixData.copyAndPasteCode ?? transaction.pix_qr_code_text,
    pix_qr_code_image_url: pixData.encodedImage ?? pixData.imageUrl ?? transaction.pix_qr_code_image_url,
  });
}

async function persistCompatibilityCache({ organizationId, plan, subscription }) {
  await updateOrganizationBillingCache(organizationId, {
    monthly_amount_cents: subscription?.amount_cents ?? plan?.price_cents ?? 0,
    subscription_status: subscription?.status ?? "pending_payment",
    subscription_plan: plan?.code ?? null,
    due_date: subscription?.next_due_date ?? null,
    trial_end: subscription?.trial_ends_at ?? null,
  });
}

async function reconcileAccessState(aggregate) {
  const snapshot = buildBillingAccessSnapshot({
    organization: aggregate.organization,
    subscription: aggregate.subscription,
    currentTransaction: aggregate.currentTransaction,
    accessLock: aggregate.accessLock,
  });

  if (!aggregate.subscription) {
    return snapshot;
  }

  if (snapshot.subscriptionStatus === "blocked" && aggregate.subscription.status !== "blocked") {
    await runBillingTransaction(async (connection) => {
      await updateOrganizationSubscription(
        aggregate.subscription.id,
        {
          status: "blocked",
          blocked_at: getNowIsoDateTime(),
          last_status_change_at: getNowIsoDateTime(),
        },
        connection,
      );
      await upsertOrganizationAccessLock(
        aggregate.subscription.organization_id,
        {
          is_locked: true,
          lock_reason: "payment_overdue",
          locked_at: getNowIsoDateTime(),
          grace_until: snapshot.graceUntil,
          related_subscription_id: aggregate.subscription.id,
          related_transaction_id: aggregate.currentTransaction?.id ?? null,
          notes: "Bloqueio automatico apos expiracao da tolerancia do billing.",
        },
        connection,
      );
      await updateOrganizationBillingCache(
        aggregate.subscription.organization_id,
        {
          monthly_amount_cents: aggregate.subscription.amount_cents,
          subscription_status: "blocked",
          subscription_plan: aggregate.plan?.code ?? null,
          due_date: aggregate.subscription.next_due_date ?? null,
          trial_end: aggregate.subscription.trial_ends_at ?? null,
        },
        connection,
      );
    });
  }

  return snapshot;
}

function buildOverviewPayload({ organization, plan, subscription, currentTransaction, access }) {
  return {
    organization_id: organization?.id ?? null,
    plan: plan
      ? {
          id: plan.id,
          name: plan.name,
          code: plan.code,
          description: plan.description,
          price_cents: plan.price_cents,
          currency: plan.currency,
          billing_cycle: plan.billing_cycle,
          trial_days: plan.trial_days,
          grace_days: plan.grace_days,
        }
      : null,
    subscription: subscription
      ? {
          id: subscription.id,
          status: subscription.status,
          billing_cycle: subscription.billing_cycle,
          amount_cents: subscription.amount_cents,
          currency: subscription.currency,
          gateway_customer_id: subscription.gateway_customer_id,
          gateway_subscription_id: subscription.gateway_subscription_id,
          next_due_date: subscription.next_due_date,
          grace_until: subscription.grace_until,
          trial_starts_at: subscription.trial_starts_at,
          trial_ends_at: subscription.trial_ends_at,
          current_period_start: subscription.current_period_start,
          current_period_end: subscription.current_period_end,
          cancel_at_period_end: subscription.cancel_at_period_end,
          cancelled_at: subscription.cancelled_at,
          expired_at: subscription.expired_at,
          blocked_at: subscription.blocked_at,
          reactivated_at: subscription.reactivated_at,
          last_payment_at: subscription.last_payment_at,
        }
      : null,
    access: {
      subscription_status: access.subscriptionStatus,
      can_access: access.canAccess,
      is_blocked: access.isBlocked,
      block_reason: access.blockReason,
      due_date: access.dueDate,
      grace_until: access.graceUntil,
      payment_notice_visible: access.paymentNoticeVisible,
      trial_ends_at: access.trialEndsAt ?? null,
    },
    current_charge: currentTransaction,
  };
}

export async function resolveOrganizationBillingAccess(organizationId) {
  await ensureBillingInfrastructure();
  const aggregate = await getOrganizationBillingAggregate(organizationId);

  if (!aggregate.organization) {
    const error = new Error("Organizacao nao encontrada.");
    error.statusCode = 404;
    throw error;
  }

  if (!aggregate.subscription) {
    const legacyAccess = await getLegacyAccessSnapshot(aggregate.organization);
    return {
      subscriptionStatus: legacyAccess.subscriptionStatus,
      canAccess: legacyAccess.canAccess,
      isBlocked: legacyAccess.isBlocked,
      blockReason: legacyAccess.blockReason,
      dueDate: legacyAccess.dueDate ?? aggregate.organization.due_date ?? null,
      graceUntil: legacyAccess.graceUntil ?? null,
      trialEndsAt: aggregate.organization.trial_end ?? null,
      paymentNoticeVisible: legacyAccess.shouldShowPaymentNotice ?? false,
      currentChargeStatus: legacyAccess.latestPaymentStatus ?? null,
    };
  }

  return reconcileAccessState(aggregate);
}

export async function getBillingOverview({ organizationId }) {
  await ensureBillingInfrastructure();
  const aggregate = await getOrganizationBillingAggregate(organizationId);

  if (!aggregate.organization) {
    const error = new Error("Organizacao nao encontrada.");
    error.statusCode = 404;
    throw error;
  }

  if (aggregate.subscription?.gateway_subscription_id && aggregate.plan) {
    await refreshAsaasPayments(aggregate.subscription, aggregate.plan);
  }

  const refreshedAggregate = await getOrganizationBillingAggregate(organizationId);
  const access = refreshedAggregate.subscription
    ? await reconcileAccessState(refreshedAggregate)
    : await getLegacyAccessSnapshot(refreshedAggregate.organization);

  return buildOverviewPayload({
    organization: refreshedAggregate.organization,
    plan: refreshedAggregate.plan,
    subscription: refreshedAggregate.subscription,
    currentTransaction: refreshedAggregate.currentTransaction,
    access,
  });
}

export async function getBillingSubscription({ organizationId }) {
  const overview = await getBillingOverview({ organizationId });
  return {
    plan: overview.plan,
    subscription: overview.subscription,
    access: overview.access,
  };
}

export async function listBillingInvoices({ organizationId }) {
  await ensureBillingInfrastructure();
  const subscription = await getOrganizationSubscriptionByOrganizationId(organizationId);
  const plan = await getSubscriptionPlanByCode();

  if (subscription?.gateway_subscription_id && plan) {
    await refreshAsaasPayments(subscription, plan);
  }

  const invoices = await listBillingTransactionsByOrganizationId(organizationId);
  return invoices;
}

export async function getCurrentCharge({ organizationId }) {
  await ensureBillingInfrastructure();
  const subscription = await getOrganizationSubscriptionByOrganizationId(organizationId);

  if (!subscription) {
    return null;
  }

  const plan = await getSubscriptionPlanByCode();

  if (subscription.gateway_subscription_id && plan) {
    await refreshAsaasPayments(subscription, plan);
  }

  const currentTransaction = await getCurrentBillingTransactionBySubscriptionId(subscription.id);
  return enrichTransactionWithPix(currentTransaction);
}

export async function startBillingCheckout({ organizationId }) {
  await ensureBillingInfrastructure();
  const organization = await getBillingOrganizationSummary(organizationId);
  const plan = await getSubscriptionPlanByCode();

  if (!organization) {
    const error = new Error("Organizacao nao encontrada.");
    error.statusCode = 404;
    throw error;
  }

  if (!plan) {
    const error = new Error("Plano de assinatura nao encontrado.");
    error.statusCode = 500;
    throw error;
  }

  const existingSubscription = await getOrganizationSubscriptionByOrganizationId(organizationId);

  if (existingSubscription?.gateway_subscription_id) {
    const currentCharge = await getCurrentCharge({ organizationId });
    return {
      ...buildOverviewPayload({
        organization,
        plan,
        subscription: existingSubscription,
        currentTransaction: currentCharge,
        access: await resolveOrganizationBillingAccess(organizationId),
      }),
      checkout: {
        started: false,
        reused_existing_subscription: true,
      },
    };
  }

  const customer =
    existingSubscription?.gateway_customer_id
      ? { id: existingSubscription.gateway_customer_id }
      : await createAsaasCustomer({
          name: organization.nome_empresa,
          email: organization.email_responsavel ?? undefined,
          mobilePhone: organization.telefone ?? undefined,
          externalReference: organization.id,
          notificationDisabled: true,
        });

  const nextDueDate = formatDateForDatabase(
    organization.trial_end ? new Date(`${organization.trial_end}T12:00:00`) : getTodayDate(),
  );
  const remoteSubscription = await createAsaasSubscription({
    customer: customer.id,
    billingType: "PIX",
    value: formatCurrencyCentsToValue(plan.price_cents),
    nextDueDate,
    cycle: mapCycleToAsaas(plan.billing_cycle),
    description: plan.name,
    externalReference: buildCheckoutExternalReference(organizationId),
  });

  let localSubscription;

  await runBillingTransaction(async (connection) => {
    localSubscription = existingSubscription
      ? await updateOrganizationSubscription(
          existingSubscription.id,
          {
            plan_id: plan.id,
            gateway_customer_id: customer.id,
            gateway_subscription_id: remoteSubscription.id,
            status: "pending_payment",
            billing_cycle: plan.billing_cycle,
            amount_cents: plan.price_cents,
            currency: plan.currency,
            current_period_start: getNowIsoDateTime(),
            next_due_date: remoteSubscription.nextDueDate ?? nextDueDate,
            grace_until: computeGraceUntil(remoteSubscription.nextDueDate ?? nextDueDate, BILLING_GRACE_DAYS),
            cancelled_at: null,
            blocked_at: null,
            expired_at: null,
            reactivated_at: existingSubscription ? getNowIsoDateTime() : null,
            last_status_change_at: getNowIsoDateTime(),
          },
          connection,
        )
      : await createOrganizationSubscription(
          {
            organization_id: organizationId,
            plan_id: plan.id,
            gateway_customer_id: customer.id,
            gateway_subscription_id: remoteSubscription.id,
            status: "pending_payment",
            billing_cycle: plan.billing_cycle,
            amount_cents: plan.price_cents,
            currency: plan.currency,
            current_period_start: getNowIsoDateTime(),
            next_due_date: remoteSubscription.nextDueDate ?? nextDueDate,
            grace_until: computeGraceUntil(remoteSubscription.nextDueDate ?? nextDueDate, BILLING_GRACE_DAYS),
            last_status_change_at: getNowIsoDateTime(),
          },
          connection,
        );

    await updateOrganizationBillingCache(
      organizationId,
      {
        monthly_amount_cents: plan.price_cents,
        subscription_status: "pending_payment",
        subscription_plan: plan.code,
        due_date: remoteSubscription.nextDueDate ?? nextDueDate,
        trial_end: organization.trial_end ?? null,
      },
      connection,
    );
  });

  await refreshAsaasPayments(localSubscription, plan);
  const currentCharge = await getCurrentCharge({ organizationId });

  return {
    ...buildOverviewPayload({
      organization,
      plan,
      subscription: localSubscription,
      currentTransaction: currentCharge,
      access: await resolveOrganizationBillingAccess(organizationId),
    }),
    checkout: {
      started: true,
      reused_existing_subscription: false,
    },
  };
}

export async function cancelBillingSubscription({ organizationId }) {
  await ensureBillingInfrastructure();
  const subscription = await getOrganizationSubscriptionByOrganizationId(organizationId);
  const plan = await getSubscriptionPlanByCode();

  if (!subscription) {
    const error = new Error("Assinatura nao encontrada.");
    error.statusCode = 404;
    throw error;
  }

  if (subscription.gateway_subscription_id) {
    await cancelAsaasSubscription(subscription.gateway_subscription_id);
  }

  await runBillingTransaction(async (connection) => {
    await updateOrganizationSubscription(
      subscription.id,
      {
        status: "cancelled",
        cancel_at_period_end: false,
        cancelled_at: getNowIsoDateTime(),
        last_status_change_at: getNowIsoDateTime(),
      },
      connection,
    );
    await upsertOrganizationAccessLock(
      organizationId,
      {
        is_locked: true,
        lock_reason: "subscription_cancelled",
        locked_at: getNowIsoDateTime(),
        related_subscription_id: subscription.id,
        notes: "Bloqueio apos cancelamento da assinatura.",
      },
      connection,
    );
    await persistCompatibilityCache({
      organizationId,
      plan,
      subscription: { ...subscription, status: "cancelled" },
    });
  });

  return getBillingSubscription({ organizationId });
}

export async function reactivateBillingSubscription({ organizationId }) {
  return startBillingCheckout({ organizationId });
}

function validateAsaasWebhookToken(receivedToken) {
  const expectedToken = getAsaasWebhookToken();

  if (!receivedToken || receivedToken !== expectedToken) {
    const error = new Error("Webhook nao autorizado.");
    error.statusCode = 401;
    throw error;
  }
}

async function applyPaymentWebhookEvent({
  eventType,
  payment,
  subscription,
  plan,
  organizationId,
  eventId,
}) {
  if (!subscription || !plan || !payment) {
    return null;
  }

  const transaction = await createOrUpdateBillingTransaction(
    mapAsaasPaymentToTransactionInput(payment, {
      organization_id: organizationId,
      subscription_id: subscription.id,
      plan_id: plan.id,
      gateway_event_reference: eventId,
      description: plan.name,
      external_reference: buildCheckoutExternalReference(organizationId),
    }),
  );
  const localStatus = mapAsaasPaymentStatus(payment.status);

  await runBillingTransaction(async (connection) => {
    if (localStatus === "confirmed" || localStatus === "received") {
      await updateOrganizationSubscription(
        subscription.id,
        {
          status: "active",
          next_due_date: payment.dueDate ?? subscription.next_due_date,
          grace_until: null,
          blocked_at: null,
          cancelled_at: null,
          expired_at: null,
          last_payment_at: payment.clientPaymentDate ?? payment.paymentDate ?? getNowIsoDateTime(),
          last_status_change_at: getNowIsoDateTime(),
        },
        connection,
      );
      await upsertOrganizationAccessLock(
        organizationId,
        {
          is_locked: false,
          lock_reason: null,
          unlocked_at: getNowIsoDateTime(),
          grace_until: null,
          related_subscription_id: subscription.id,
          related_transaction_id: transaction.id,
          notes: "Acesso liberado apos confirmacao do pagamento pelo webhook.",
        },
        connection,
      );
      await updateOrganizationBillingCache(
        organizationId,
        {
          monthly_amount_cents: plan.price_cents,
          subscription_status: "active",
          subscription_plan: plan.code,
          due_date: payment.dueDate ?? subscription.next_due_date,
          trial_end: null,
        },
        connection,
      );
    }

    if (localStatus === "overdue") {
      const graceUntil = computeGraceUntil(payment.dueDate ?? subscription.next_due_date, BILLING_GRACE_DAYS);
      await updateOrganizationSubscription(
        subscription.id,
        {
          status: "past_due",
          next_due_date: payment.dueDate ?? subscription.next_due_date,
          grace_until: graceUntil,
          last_status_change_at: getNowIsoDateTime(),
        },
        connection,
      );
      await upsertOrganizationAccessLock(
        organizationId,
        {
          is_locked: false,
          lock_reason: "payment_overdue",
          grace_until: graceUntil,
          related_subscription_id: subscription.id,
          related_transaction_id: transaction.id,
          notes: "Pagamento vencido. Organizacao em periodo de tolerancia.",
        },
        connection,
      );
      await updateOrganizationBillingCache(
        organizationId,
        {
          monthly_amount_cents: plan.price_cents,
          subscription_status: "past_due",
          subscription_plan: plan.code,
          due_date: payment.dueDate ?? subscription.next_due_date,
          trial_end: null,
        },
        connection,
      );
    }

    if (eventType === "PAYMENT_DELETED" || localStatus === "cancelled") {
      await updateOrganizationSubscription(
        subscription.id,
        {
          status: "cancelled",
          cancelled_at: getNowIsoDateTime(),
          last_status_change_at: getNowIsoDateTime(),
        },
        connection,
      );
      await upsertOrganizationAccessLock(
        organizationId,
        {
          is_locked: true,
          lock_reason: "subscription_cancelled",
          locked_at: getNowIsoDateTime(),
          related_subscription_id: subscription.id,
          related_transaction_id: transaction.id,
          notes: "Bloqueio aplicado a partir do webhook de cancelamento.",
        },
        connection,
      );
      await updateOrganizationBillingCache(
        organizationId,
        {
          monthly_amount_cents: plan.price_cents,
          subscription_status: "cancelled",
          subscription_plan: plan.code,
          due_date: payment.dueDate ?? subscription.next_due_date,
          trial_end: null,
        },
        connection,
      );
    }
  });

  return transaction;
}

export async function processAsaasWebhook({ rawBody, headers, payload }) {
  await ensureBillingInfrastructure();

  const receivedToken =
    headers["asaas-access-token"] ??
    headers["Asaas-Access-Token"] ??
    headers["ASAAS-ACCESS-TOKEN"] ??
    null;
  validateAsaasWebhookToken(receivedToken);

  const eventType = typeof payload?.event === "string" ? payload.event : "";
  const payment = payload?.payment ?? null;
  const eventId =
    typeof payload?.id === "string"
      ? payload.id
      : payment?.id
        ? `${eventType}:${payment.id}`
        : `${eventType}:${Date.now()}`;

  const subscription = payment?.subscription
    ? await getOrganizationSubscriptionByGatewaySubscriptionId(payment.subscription)
    : null;
  const organizationId = subscription?.organization_id ?? null;
  const plan = subscription ? await getSubscriptionPlanByCode() : null;
  const currentTransaction = payment?.id
    ? await findBillingTransactionByGatewayPaymentId(payment.id)
    : null;

  const eventRegistration = await createWebhookEventLog({
    event_id: eventId,
    event_type: eventType || "UNKNOWN",
    organization_id: organizationId,
    subscription_id: subscription?.id ?? null,
    billing_transaction_id: currentTransaction?.id ?? null,
    webhook_token_received: receivedToken,
    signature_valid: true,
    payload_text: rawBody || JSON.stringify(payload ?? {}),
    processed: false,
    processing_attempts: 0,
  });

  if (eventRegistration.duplicate) {
    return {
      duplicate: true,
      processed: Boolean(eventRegistration.event?.processed),
    };
  }

  try {
    const transaction = await applyPaymentWebhookEvent({
      eventType,
      payment,
      subscription,
      plan,
      organizationId,
      eventId,
    });

    await updateWebhookEventLog(eventRegistration.event.id, {
      organization_id: organizationId,
      subscription_id: subscription?.id ?? null,
      billing_transaction_id: transaction?.id ?? currentTransaction?.id ?? null,
      signature_valid: true,
      processed: true,
      processed_at: getNowIsoDateTime(),
      processing_attempts: Number(eventRegistration.event.processing_attempts ?? 0) + 1,
      processing_error: null,
    });

    return {
      duplicate: false,
      processed: true,
    };
  } catch (error) {
    await updateWebhookEventLog(eventRegistration.event.id, {
      organization_id: organizationId,
      subscription_id: subscription?.id ?? null,
      billing_transaction_id: currentTransaction?.id ?? null,
      signature_valid: true,
      processed: false,
      processing_attempts: Number(eventRegistration.event.processing_attempts ?? 0) + 1,
      processing_error: error.message ?? "Falha ao processar webhook.",
    });

    throw error;
  }
}
