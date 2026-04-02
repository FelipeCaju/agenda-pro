import { getRequestAuthContext } from "../lib/request-auth.js";
import {
  cancelBillingSubscription,
  getBillingSubscription,
  getCurrentCharge,
  getBillingOverview,
  listBillingInvoices,
  reactivateBillingSubscription,
  startHostedCardCheckout,
  startBillingCheckout,
} from "../services/billing.service.js";

function sendError(response, error) {
  response.status(error.statusCode ?? 500).json({
    message: error.message ?? "Erro inesperado ao processar billing.",
  });
}

export async function startBillingCheckoutController(request, response) {
  try {
    const { organization } = await getRequestAuthContext(request);
    const data = await startBillingCheckout({ organizationId: organization.id });
    response.json({ data, message: "Checkout de billing iniciado com sucesso." });
  } catch (error) {
    sendError(response, error);
  }
}

export async function startHostedCardCheckoutController(request, response) {
  try {
    const { organization } = await getRequestAuthContext(request);
    const data = await startHostedCardCheckout({
      organizationId: organization.id,
      frontendOrigin: request.headers.origin ?? request.headers.referer ?? "",
    });
    response.json({ data, message: "Checkout hospedado com cartao criado com sucesso." });
  } catch (error) {
    sendError(response, error);
  }
}

export async function getBillingSubscriptionController(request, response) {
  try {
    const { organization } = await getRequestAuthContext(request);
    const data = await getBillingSubscription({ organizationId: organization.id });
    response.json({ data });
  } catch (error) {
    sendError(response, error);
  }
}

export async function cancelBillingSubscriptionController(request, response) {
  try {
    const { organization } = await getRequestAuthContext(request);
    const data = await cancelBillingSubscription({ organizationId: organization.id });
    response.json({ data, message: "Assinatura cancelada com sucesso." });
  } catch (error) {
    sendError(response, error);
  }
}

export async function reactivateBillingSubscriptionController(request, response) {
  try {
    const { organization } = await getRequestAuthContext(request);
    const data = await reactivateBillingSubscription({ organizationId: organization.id });
    response.json({ data, message: "Assinatura reativada com sucesso." });
  } catch (error) {
    sendError(response, error);
  }
}

export async function listBillingInvoicesController(request, response) {
  try {
    const { organization } = await getRequestAuthContext(request);
    const data = await listBillingInvoices({ organizationId: organization.id });
    response.json({ data, meta: { total: data.length } });
  } catch (error) {
    sendError(response, error);
  }
}

export async function getCurrentChargeController(request, response) {
  try {
    const { organization } = await getRequestAuthContext(request);
    const data = await getCurrentCharge({ organizationId: organization.id });
    response.json({ data });
  } catch (error) {
    sendError(response, error);
  }
}

export async function getBillingOverviewController(request, response) {
  try {
    const { organization } = await getRequestAuthContext(request);
    const data = await getBillingOverview({ organizationId: organization.id });
    response.json({ data });
  } catch (error) {
    sendError(response, error);
  }
}
