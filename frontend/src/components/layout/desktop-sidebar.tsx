import { NavLink } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CalendarIcon, ScissorsIcon, UsersIcon } from "@/components/ui/icons";
import { useAuth } from "@/hooks/use-auth";
import {
  useOrganizationPaymentsQuery,
  useOrganizationQuery,
} from "@/hooks/use-organization-query";
import { useOrganization } from "@/hooks/use-organization";
import { useSettingsQuery } from "@/hooks/use-settings-query";
import { getBillingAlert } from "@/utils/billing";
import { cn } from "@/utils/cn";

const links = [
  { to: "/agenda", label: "Agenda", icon: "calendar" },
  { to: "/orcamentos", label: "Orcamentos", icon: "receipt" },
  { to: "/clientes", label: "Clientes", icon: "users" },
  { to: "/servicos", label: "Servicos", icon: "scissors" },
  { to: "/", label: "Painel", icon: "grid" },
  { to: "/gestao", label: "Gestao", icon: "settings" },
] as const;

function SidebarIcon({ icon }: { icon: (typeof links)[number]["icon"] }) {
  if (icon === "calendar") {
    return <CalendarIcon className="h-5 w-5" />;
  }

  if (icon === "users") {
    return <UsersIcon className="h-5 w-5" />;
  }

  if (icon === "receipt") {
    return (
      <svg
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
        viewBox="0 0 24 24"
      >
        <path d="M7 4.5h10a1 1 0 0 1 1 1v14l-2-1.3-2 1.3-2-1.3-2 1.3-2-1.3-2 1.3v-14a1 1 0 0 1 1-1Z" />
        <path d="M9 8.5h6" />
        <path d="M9 12h6" />
      </svg>
    );
  }

  if (icon === "scissors") {
    return <ScissorsIcon className="h-5 w-5" />;
  }

  if (icon === "grid") {
    return (
      <svg
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
        viewBox="0 0 24 24"
      >
        <rect x="4" y="4" width="6.5" height="6.5" rx="1.5" />
        <rect x="13.5" y="4" width="6.5" height="6.5" rx="1.5" />
        <rect x="4" y="13.5" width="6.5" height="6.5" rx="1.5" />
        <rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.5" />
      </svg>
    );
  }

  return (
    <svg
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2.75v2.1" />
      <path d="M12 19.15v2.1" />
      <path d="m4.76 4.76 1.48 1.48" />
      <path d="m17.76 17.76 1.48 1.48" />
      <path d="M2.75 12h2.1" />
      <path d="M19.15 12h2.1" />
      <path d="m4.76 19.24 1.48-1.48" />
      <path d="m17.76 6.24 1.48-1.48" />
    </svg>
  );
}

export function DesktopSidebar() {
  const { signOut, user } = useAuth();
  const { organization, role, isSubscriptionBlocked } = useOrganization();
  const { data: currentOrganization } = useOrganizationQuery();
  const { data: payments = [] } = useOrganizationPaymentsQuery();
  const { data: settings } = useSettingsQuery();
  const billingAlert = getBillingAlert(currentOrganization, payments);
  const visibleLinks = links.filter(
    (link) => link.to !== "/orcamentos" || settings?.criarOrcamentos !== false,
  );

  const subscriptionLabel =
    organization?.subscriptionStatus === "active"
      ? "Assinatura ativa"
      : organization?.subscriptionStatus === "trial"
        ? "Periodo de teste"
        : organization?.subscriptionStatus === "overdue"
          ? "Pagamento em atraso"
          : organization?.subscriptionStatus === "blocked"
            ? "Acesso bloqueado"
            : organization?.subscriptionStatus === "canceled"
              ? "Assinatura cancelada"
              : null;

  return (
    <aside className="hidden xl:sticky xl:top-0 xl:flex xl:h-screen xl:flex-col xl:gap-5 xl:overflow-y-auto xl:py-6">
      <div className="rounded-[28px] border border-slate-200 bg-white px-5 py-5 shadow-soft">
        <div className="space-y-4">
          <p className="text-[11px] uppercase tracking-[0.32em] text-brand-700">AgendaPro</p>
          <h2 className="text-[1.55rem] font-semibold tracking-[-0.04em] text-ink">
            Gestao elegante em qualquer tela
          </h2>
          <p className="text-sm leading-6 text-slate-500">
            Operacao rapida no celular, visual organizado no desktop e tudo em um so lugar.
          </p>

          <div className="space-y-2 rounded-[24px] bg-slate-50/90 p-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="app-pill">Empresa ativa</span>
              {subscriptionLabel ? <span className="app-pill">{subscriptionLabel}</span> : null}
            </div>
            <p className="text-base font-semibold text-ink">
              {organization?.nomeEmpresa ?? "Configuracao inicial em andamento"}
            </p>
            <p className="text-sm text-slate-500">
              {user?.nome ?? "Usuario"} - {role ?? "sem perfil"}
            </p>
            {isSubscriptionBlocked ? (
              <p className="text-sm font-medium text-amber-700">Acesso limitado por assinatura</p>
            ) : null}
          </div>

          <Button
            className="w-full bg-night text-white hover:bg-ink"
            onClick={() => void signOut()}
          >
            Sair
          </Button>
        </div>
      </div>

      <nav className="rounded-[28px] border border-slate-200 bg-white p-3 shadow-soft">
        <div className="space-y-1.5">
          {visibleLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                cn(
                  "relative flex items-center gap-3 rounded-[20px] px-4 py-3 text-sm font-semibold text-slate-500 transition",
                  isActive && "bg-brand-50 text-brand-700 shadow-soft",
                )
              }
            >
              {link.to === "/gestao" && billingAlert.hasAlert ? (
                <span className="absolute right-4 top-3 h-2.5 w-2.5 rounded-full bg-rose-500 ring-2 ring-white" />
              ) : null}
              <SidebarIcon icon={link.icon} />
              {link.label}
            </NavLink>
          ))}
        </div>
      </nav>
    </aside>
  );
}
