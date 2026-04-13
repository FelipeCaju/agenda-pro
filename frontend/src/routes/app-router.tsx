import { Suspense, lazy } from "react";
import { AdminShell } from "@/components/layout/admin-shell";
import { FullscreenState } from "@/components/ui/fullscreen-state";
import { Outlet, createBrowserRouter } from "react-router-dom";
import { AppShell } from "@/components/layout/app-shell";
import { AdminProtectedRoute } from "@/routes/admin-protected-route";
import { ProtectedRoute } from "@/routes/protected-route";
import { PublicRoute } from "@/routes/public-route";
import { RouteErrorPage } from "@/routes/route-error-page";

const LoginPage = lazy(async () => ({ default: (await import("@/pages/login-page")).LoginPage }));
const SignupPage = lazy(async () => ({ default: (await import("@/pages/signup-page")).SignupPage }));
const OnboardingPage = lazy(async () => ({
  default: (await import("@/pages/onboarding-page")).OnboardingPage,
}));
const SubscriptionBlockedPage = lazy(async () => ({
  default: (await import("@/pages/subscription-blocked-page")).SubscriptionBlockedPage,
}));
const BillingPlanPage = lazy(async () => ({
  default: (await import("@/pages/billing-plan-page")).BillingPlanPage,
}));
const BillingInvoicesPage = lazy(async () => ({
  default: (await import("@/pages/billing-invoices-page")).BillingInvoicesPage,
}));
const PlatformAdminPage = lazy(async () => ({
  default: (await import("@/pages/platform-admin-page")).PlatformAdminPage,
}));
const PlatformOrganizationPage = lazy(async () => ({
  default: (await import("@/pages/platform-organization-page")).PlatformOrganizationPage,
}));
const DashboardPage = lazy(async () => ({
  default: (await import("@/pages/dashboard-page")).DashboardPage,
}));
const ManagementPage = lazy(async () => ({
  default: (await import("@/pages/management-page")).ManagementPage,
}));
const PaymentPage = lazy(async () => ({
  default: (await import("@/pages/payment-page")).PaymentPage,
}));
const AgendaPage = lazy(async () => ({ default: (await import("@/pages/agenda-page")).AgendaPage }));
const NewAppointmentPage = lazy(async () => ({
  default: (await import("@/pages/new-appointment-page")).NewAppointmentPage,
}));
const AppointmentDetailPage = lazy(async () => ({
  default: (await import("@/pages/appointment-detail-page")).AppointmentDetailPage,
}));
const BlockedSlotsPage = lazy(async () => ({
  default: (await import("@/pages/blocked-slots-page")).BlockedSlotsPage,
}));
const ClientsPage = lazy(async () => ({ default: (await import("@/pages/clients-page")).ClientsPage }));
const ClientFormPage = lazy(async () => ({
  default: (await import("@/pages/client-form-page")).ClientFormPage,
}));
const ServicesPage = lazy(async () => ({
  default: (await import("@/pages/services-page")).ServicesPage,
}));
const ServiceFormPage = lazy(async () => ({
  default: (await import("@/pages/service-form-page")).ServiceFormPage,
}));
const SettingsPage = lazy(async () => ({
  default: (await import("@/pages/settings-page")).SettingsPage,
}));
const WhatsappSettingsPage = lazy(async () => ({
  default: (await import("@/pages/whatsapp-settings-page")).WhatsappSettingsPage,
}));
const OrcamentosSettingsPage = lazy(async () => ({
  default: (await import("@/pages/orcamentos-settings-page")).OrcamentosSettingsPage,
}));
const OrcamentosPage = lazy(async () => ({
  default: (await import("@/pages/orcamentos-page")).OrcamentosPage,
}));
const OrcamentoFormPage = lazy(async () => ({
  default: (await import("@/pages/orcamento-form-page")).OrcamentoFormPage,
}));
const ProfessionalsPage = lazy(async () => ({
  default: (await import("@/pages/professionals-page")).ProfessionalsPage,
}));
const RemindersPage = lazy(async () => ({
  default: (await import("@/pages/reminders-page")).RemindersPage,
}));
const RecurrencePage = lazy(async () => ({
  default: (await import("@/pages/recurrence-page")).RecurrencePage,
}));
const RecurrenceFormPage = lazy(async () => ({
  default: (await import("@/pages/recurrence-form-page")).RecurrenceFormPage,
}));
const RecurringChargesPage = lazy(async () => ({
  default: (await import("@/pages/recurring-charges-page")).RecurringChargesPage,
}));
const NotFoundPage = lazy(async () => ({
  default: (await import("@/pages/not-found-page")).NotFoundPage,
}));

function withRouteSuspense(element: JSX.Element) {
  return (
    <Suspense
      fallback={
        <FullscreenState
          eyebrow="AgendaPro"
          title="Abrindo tela"
          description="Estamos carregando os dados da pagina sem travar a navegacao."
        />
      }
    >
      {element}
    </Suspense>
  );
}

export const router = createBrowserRouter([
  {
    element: <Outlet />,
    errorElement: <RouteErrorPage />,
    children: [
      {
        element: <PublicRoute />,
        children: [
          {
            path: "/login",
            element: withRouteSuspense(<LoginPage />),
          },
          {
            path: "/criar-conta",
            element: withRouteSuspense(<SignupPage />),
          },
        ],
      },
      {
        element: <ProtectedRoute allowOnboarding allowBlocked />,
        children: [
          {
            path: "/onboarding",
            element: withRouteSuspense(<OnboardingPage />),
          },
        ],
      },
      {
        element: <ProtectedRoute allowBlocked />,
        children: [
          {
            path: "/assinatura-bloqueada",
            element: withRouteSuspense(<SubscriptionBlockedPage />),
          },
        ],
      },
      {
        element: <ProtectedRoute allowBlocked allowActiveAccess />,
        children: [
          {
            element: <AppShell />,
            children: [
              {
                path: "/meu-plano",
                element: withRouteSuspense(<BillingPlanPage />),
              },
              {
                path: "/faturas",
                element: withRouteSuspense(<BillingInvoicesPage />),
              },
              {
                path: "/pagamento",
                element: withRouteSuspense(<PaymentPage />),
              },
            ],
          },
        ],
      },
      {
        element: <AdminProtectedRoute />,
        children: [
          {
            element: <AdminShell />,
            children: [
              { path: "/admin", element: withRouteSuspense(<PlatformAdminPage />) },
              {
                path: "/admin/organizacoes/:organizationId",
                element: withRouteSuspense(<PlatformOrganizationPage />),
              },
            ],
          },
        ],
      },
      {
        element: <ProtectedRoute />,
        children: [
          {
            element: <AppShell />,
            children: [
              { path: "/", element: withRouteSuspense(<DashboardPage />) },
              { path: "/gestao", element: withRouteSuspense(<ManagementPage />) },
              { path: "/agenda", element: withRouteSuspense(<AgendaPage />) },
              { path: "/agenda/novo", element: withRouteSuspense(<NewAppointmentPage />) },
              {
                path: "/agenda/:appointmentId",
                element: withRouteSuspense(<AppointmentDetailPage />),
              },
              { path: "/bloqueios", element: withRouteSuspense(<BlockedSlotsPage />) },
              { path: "/clientes", element: withRouteSuspense(<ClientsPage />) },
              { path: "/clientes/novo", element: withRouteSuspense(<ClientFormPage />) },
              {
                path: "/clientes/:clientId/editar",
                element: withRouteSuspense(<ClientFormPage />),
              },
              { path: "/servicos", element: withRouteSuspense(<ServicesPage />) },
              { path: "/servicos/novo", element: withRouteSuspense(<ServiceFormPage />) },
              {
                path: "/servicos/:serviceId/editar",
                element: withRouteSuspense(<ServiceFormPage />),
              },
              { path: "/orcamentos", element: withRouteSuspense(<OrcamentosPage />) },
              { path: "/orcamentos/novo", element: withRouteSuspense(<OrcamentoFormPage />) },
              {
                path: "/orcamentos/:quoteId",
                element: withRouteSuspense(<OrcamentoFormPage />),
              },
              { path: "/configuracoes", element: withRouteSuspense(<SettingsPage />) },
              {
                path: "/configuracoes/whatsapp",
                element: withRouteSuspense(<WhatsappSettingsPage />),
              },
              {
                path: "/configuracoes/orcamentos",
                element: withRouteSuspense(<OrcamentosSettingsPage />),
              },
              { path: "/funcionarios", element: withRouteSuspense(<ProfessionalsPage />) },
              { path: "/lembretes", element: withRouteSuspense(<RemindersPage />) },
              { path: "/recorrencia", element: withRouteSuspense(<RecurrencePage />) },
              { path: "/recorrencia/nova", element: withRouteSuspense(<RecurrenceFormPage />) },
              {
                path: "/recorrencia/:profileId/editar",
                element: withRouteSuspense(<RecurrenceFormPage />),
              },
              {
                path: "/recorrencia/cobrancas",
                element: withRouteSuspense(<RecurringChargesPage />),
              },
            ],
          },
        ],
      },
      {
        path: "*",
        element: withRouteSuspense(<NotFoundPage />),
      },
    ],
  },
]);
