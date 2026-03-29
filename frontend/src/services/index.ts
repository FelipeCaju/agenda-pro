export { ApiError, apiClient, type ApiSuccess, type ApiMeta } from "@/services/apiClient";
export {
  authService,
  type AuthSession,
  type SessionOrganization,
  type SessionUser,
  type SignInInput,
  type CompleteOnboardingInput,
  type UserRole,
} from "@/services/authService";
export {
  organizationService,
  type OrganizationMember,
  type OrganizationProfile,
} from "@/services/organizationService";
export { clientService, type Client, type ClientInput } from "@/services/clientService";
export {
  serviceService,
  type BusinessService,
  type BusinessServiceInput,
} from "@/services/serviceService";
export {
  appointmentService,
  type AgendaView,
  type Appointment,
  type AppointmentInput,
  type AppointmentStatus,
} from "@/services/appointmentService";
export {
  localNotificationService,
} from "@/services/localNotificationService";
export {
  notificationPreferencesService,
  type NotificationPreferences,
} from "@/services/notificationPreferencesService";
export {
  orcamentoService,
  type Orcamento,
  type OrcamentoInput,
  type OrcamentoItem,
  type OrcamentoStatus,
  type OrcamentoAppointmentDraft,
} from "@/services/orcamentoService";
export {
  dashboardService,
  type DashboardPeriod,
  type DashboardStatusFilter,
  type DashboardSummary,
} from "@/services/dashboardService";
export { settingsService, type AppSettings } from "@/services/settingsService";
export {
  whatsappService,
  type WhatsappMessageInput,
  type WhatsappSendResult,
  type WhatsappStatus,
} from "@/services/whatsappService";
export {
  reminderService,
  type Reminder,
  type ReminderReplyInput,
} from "@/services/reminderService";
