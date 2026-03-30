import { AdminShell } from "@/components/layout/admin-shell";
import { Outlet, createBrowserRouter } from "react-router-dom";
import { AppShell } from "@/components/layout/app-shell";
import { AgendaPage } from "@/pages/agenda-page";
import { AppointmentDetailPage } from "@/pages/appointment-detail-page";
import { BlockedSlotsPage } from "@/pages/blocked-slots-page";
import { ClientFormPage } from "@/pages/client-form-page";
import { ClientsPage } from "@/pages/clients-page";
import { DashboardPage } from "@/pages/dashboard-page";
import { LoginPage } from "@/pages/login-page";
import { ManagementPage } from "@/pages/management-page";
import { NotFoundPage } from "@/pages/not-found-page";
import { NewAppointmentPage } from "@/pages/new-appointment-page";
import { OnboardingPage } from "@/pages/onboarding-page";
import { PlatformAdminPage } from "@/pages/platform-admin-page";
import { PlatformOrganizationPage } from "@/pages/platform-organization-page";
import { ProfessionalsPage } from "@/pages/professionals-page";
import { RemindersPage } from "@/pages/reminders-page";
import { SettingsPage } from "@/pages/settings-page";
import { ServiceFormPage } from "@/pages/service-form-page";
import { ServicesPage } from "@/pages/services-page";
import { SignupPage } from "@/pages/signup-page";
import { SubscriptionBlockedPage } from "@/pages/subscription-blocked-page";
import { AdminProtectedRoute } from "@/routes/admin-protected-route";
import { ProtectedRoute } from "@/routes/protected-route";
import { PublicRoute } from "@/routes/public-route";
import { RouteErrorPage } from "@/routes/route-error-page";

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
            element: <LoginPage />,
          },
          {
            path: "/criar-conta",
            element: <SignupPage />,
          },
        ],
      },
      {
        element: <ProtectedRoute allowOnboarding allowBlocked />,
        children: [
          {
            path: "/onboarding",
            element: <OnboardingPage />,
          },
        ],
      },
      {
        element: <ProtectedRoute allowBlocked />,
        children: [
          {
            path: "/assinatura-bloqueada",
            element: <SubscriptionBlockedPage />,
          },
        ],
      },
      {
        element: <AdminProtectedRoute />,
        children: [
          {
            element: <AdminShell />,
            children: [
              { path: "/admin", element: <PlatformAdminPage /> },
              {
                path: "/admin/organizacoes/:organizationId",
                element: <PlatformOrganizationPage />,
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
              { path: "/", element: <DashboardPage /> },
              { path: "/gestao", element: <ManagementPage /> },
              { path: "/agenda", element: <AgendaPage /> },
              { path: "/agenda/novo", element: <NewAppointmentPage /> },
              { path: "/agenda/:appointmentId", element: <AppointmentDetailPage /> },
              { path: "/bloqueios", element: <BlockedSlotsPage /> },
              { path: "/clientes", element: <ClientsPage /> },
              { path: "/clientes/novo", element: <ClientFormPage /> },
              { path: "/clientes/:clientId/editar", element: <ClientFormPage /> },
              { path: "/servicos", element: <ServicesPage /> },
              { path: "/servicos/novo", element: <ServiceFormPage /> },
              { path: "/servicos/:serviceId/editar", element: <ServiceFormPage /> },
              { path: "/configuracoes", element: <SettingsPage /> },
              { path: "/funcionarios", element: <ProfessionalsPage /> },
              { path: "/lembretes", element: <RemindersPage /> },
            ],
          },
        ],
      },
      {
        path: "*",
        element: <NotFoundPage />,
      },
    ],
  },
]);
