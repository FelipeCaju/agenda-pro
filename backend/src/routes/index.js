import { Router } from "express";
import {
  deleteCurrentAccount,
  finishOnboarding,
  getSession,
  login,
  signOut,
} from "../controllers/auth.controller.js";
import { getDashboardSummaryController } from "../controllers/dashboard.controller.js";
import {
  createAppointmentController,
  deleteAppointmentController,
  getAppointmentController,
  listAgendaController,
  listUpcomingAgendaController,
  updateAppointmentController,
  updateAppointmentPaymentStatusController,
  updateAppointmentStatusController,
} from "../controllers/agenda.controller.js";
import {
  cancelBillingSubscriptionController,
  getBillingOverviewController,
  getBillingSubscriptionController,
  getCurrentChargeController,
  listBillingInvoicesController,
  reactivateBillingSubscriptionController,
  startBillingCheckoutController,
} from "../controllers/billing.controller.js";
import {
  createBlockedSlotController,
  deleteBlockedSlotController,
  listBlockedSlotsController,
} from "../controllers/blocked-slots.controller.js";
import {
  createClientController,
  deleteClientController,
  getClientController,
  listClientsController,
  toggleClientActiveController,
  updateClientController,
} from "../controllers/clients.controller.js";
import {
  getCurrentOrganizationController,
  listCurrentOrganizationPaymentsController,
  listOrganizationMembersController,
  notifyCurrentOrganizationPaymentPaidController,
  updateCurrentOrganizationController,
} from "../controllers/organization.controller.js";
import {
  createProfessionalController,
  getProfessionalController,
  listProfessionalsController,
  updateProfessionalController,
} from "../controllers/professionals.controller.js";
import {
  listReminders,
  registerReminderReplyController,
  sendManualReminderController,
} from "../controllers/reminders.controller.js";
import {
  approveQuoteController,
  convertQuoteToServiceOrderController,
  createQuoteAppointmentDraftController,
  createQuoteController,
  getQuoteController,
  listQuotesController,
  rejectQuoteController,
  updateQuoteController,
} from "../controllers/quotes.controller.js";
import {
  createServiceController,
  deleteServiceController,
  getServiceController,
  listServicesController,
  toggleServiceActiveController,
  updateServiceController,
} from "../controllers/services.controller.js";
import {
  getSettingsController,
  updateSettingsController,
} from "../controllers/settings.controller.js";
import { listTenants } from "../controllers/tenant.controller.js";
import {
  getWhatsappStatusController,
  receiveWhatsappWebhookController,
  sendWhatsappTestMessageController,
} from "../controllers/whatsapp.controller.js";
import { receiveAsaasWebhookController } from "../controllers/webhooks.controller.js";
import {
  createAdminOrganizationController,
  createAdminOrganizationPaymentController,
  getAdminOrganizationController,
  getPlatformSettingsController,
  listAdminOrganizationPaymentsController,
  listAdminOrganizationsController,
  updatePlatformSettingsController,
  updateAdminOrganizationSubscriptionController,
} from "../controllers/platform-admin.controller.js";
import { getRequestPlatformAdminContext } from "../lib/request-auth.js";

export const router = Router();

router.use("/admin", async (request, response, next) => {
  try {
    await getRequestPlatformAdminContext(request);
    next();
  } catch (error) {
    response.status(error.statusCode ?? 403).json({
      message: error.message ?? "Acesso de Super Admin obrigatorio.",
    });
  }
});

router.get("/health", (_request, response) => {
  response.json({ status: "ok" });
});

router.post("/auth/login", login);
router.get("/auth/session", getSession);
router.post("/auth/onboarding", finishOnboarding);
router.post("/auth/logout", signOut);
router.delete("/auth/account", deleteCurrentAccount);
router.post("/whatsapp/webhook", receiveWhatsappWebhookController);
router.post("/webhooks/asaas", receiveAsaasWebhookController);
router.get("/tenants", listTenants);
router.get("/dashboard/summary", getDashboardSummaryController);
router.get("/billing/overview", getBillingOverviewController);
router.post("/billing/checkout/start", startBillingCheckoutController);
router.get("/billing/subscription", getBillingSubscriptionController);
router.post("/billing/subscription/cancel", cancelBillingSubscriptionController);
router.post("/billing/subscription/reactivate", reactivateBillingSubscriptionController);
router.get("/billing/invoices", listBillingInvoicesController);
router.get("/billing/current-charge", getCurrentChargeController);
router.get("/organizations/current", getCurrentOrganizationController);
router.patch("/organizations/current", updateCurrentOrganizationController);
router.get("/organizations/current/users", listOrganizationMembersController);
router.get("/organizations/current/payments", listCurrentOrganizationPaymentsController);
router.post(
  "/organizations/current/payments/:paymentId/notify-paid",
  notifyCurrentOrganizationPaymentPaidController,
);
router.get("/organizations/current/professionals", listProfessionalsController);
router.get("/organizations/current/professionals/:professionalId", getProfessionalController);
router.post("/organizations/current/professionals", createProfessionalController);
router.put("/organizations/current/professionals/:professionalId", updateProfessionalController);
router.get("/settings", getSettingsController);
router.patch("/settings", updateSettingsController);
router.get("/whatsapp/status", getWhatsappStatusController);
router.post("/whatsapp/test-message", sendWhatsappTestMessageController);
router.get("/blocked-slots", listBlockedSlotsController);
router.post("/blocked-slots", createBlockedSlotController);
router.delete("/blocked-slots/:blockedSlotId", deleteBlockedSlotController);
router.get("/agenda", listAgendaController);
router.get("/agenda/upcoming", listUpcomingAgendaController);
router.get("/agenda/:appointmentId", getAppointmentController);
router.post("/agenda", createAppointmentController);
router.put("/agenda/:appointmentId", updateAppointmentController);
router.patch("/agenda/:appointmentId/status", updateAppointmentStatusController);
router.patch("/agenda/:appointmentId/payment-status", updateAppointmentPaymentStatusController);
router.delete("/agenda/:appointmentId", deleteAppointmentController);
router.get("/clients", listClientsController);
router.get("/clients/:clientId", getClientController);
router.post("/clients", createClientController);
router.put("/clients/:clientId", updateClientController);
router.patch("/clients/:clientId/status", toggleClientActiveController);
router.delete("/clients/:clientId", deleteClientController);
router.get("/services", listServicesController);
router.get("/services/:serviceId", getServiceController);
router.post("/services", createServiceController);
router.put("/services/:serviceId", updateServiceController);
router.patch("/services/:serviceId/status", toggleServiceActiveController);
router.delete("/services/:serviceId", deleteServiceController);
router.get("/quotes", listQuotesController);
router.get("/quotes/:quoteId", getQuoteController);
router.post("/quotes", createQuoteController);
router.put("/quotes/:quoteId", updateQuoteController);
router.post("/quotes/:quoteId/approve", approveQuoteController);
router.post("/quotes/:quoteId/reject", rejectQuoteController);
router.post("/quotes/:quoteId/schedule-draft", createQuoteAppointmentDraftController);
router.post("/quotes/:quoteId/service-order", convertQuoteToServiceOrderController);
router.get("/reminders", listReminders);
router.post("/reminders/manual-send", sendManualReminderController);
router.patch("/reminders/:appointmentId/reply", registerReminderReplyController);
router.get("/admin/platform-settings", getPlatformSettingsController);
router.patch("/admin/platform-settings", updatePlatformSettingsController);
router.get("/admin/organizations", listAdminOrganizationsController);
router.post("/admin/organizations", createAdminOrganizationController);
router.get("/admin/organizations/:organizationId", getAdminOrganizationController);
router.patch(
  "/admin/organizations/:organizationId/subscription",
  updateAdminOrganizationSubscriptionController,
);
router.get(
  "/admin/organizations/:organizationId/payments",
  listAdminOrganizationPaymentsController,
);
router.post(
  "/admin/organizations/:organizationId/payments",
  createAdminOrganizationPaymentController,
);
