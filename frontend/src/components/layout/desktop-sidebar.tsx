import { NavLink } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { AppBrandIcon } from "@/components/ui/app-brand-icon";
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
import { SYSTEM_VERSION_LABEL } from "@/config/system-version";

const links = [
  { to: "/agenda", label: "Agenda", icon: "calendar" },
  { to: "/recorrencia", label: "Recorrencia", icon: "money" },
  { to: "/orcamentos", label: "Orcamentos", icon: "receipt" },
  { to: "/clientes", label: "Clientes", icon: "users" },
  { to: "/servicos", label: "Servicos", icon: "scissors" },
  { to: "/", label: "Painel", icon: "grid" },
  { to: "/gestao", label: "Gestao", icon: "settings" },
  { to: "/configuracoes", label: "Configuracoes", icon: "settings" },
  { to: "/dados-da-empresa", label: "Dados da empresa", icon: "building" },
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

  if (icon === "money") {
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
        <path d="M12 4v16" />
        <path d="M15.5 7.5c0-1.4-1.6-2.5-3.5-2.5s-3.5 1.1-3.5 2.5S10.1 10 12 10s3.5 1.1 3.5 2.5S13.9 15 12 15s-3.5-1.1-3.5-2.5" />
      </svg>
    );
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

  if (icon === "building") {
    return (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" viewBox="0 0 24 24">
        <path d="M4 20V5.5A1.5 1.5 0 0 1 5.5 4h8A1.5 1.5 0 0 1 15 5.5V20" />
        <path d="M15 9h3.5A1.5 1.5 0 0 1 20 10.5V20" />
        <path d="M8 8h3M8 12h3M8 16h3M17 13h.01M17 16h.01M3 20h18" />
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
  const { organization, role } = useOrganization();
  const { data: currentOrganization } = useOrganizationQuery();
  const { data: payments = [] } = useOrganizationPaymentsQuery();
  const { data: settings } = useSettingsQuery();
  const billingAlert = getBillingAlert(currentOrganization, payments);
  const visibleLinks = links.filter(
    (link) =>
      (link.to !== "/orcamentos" || settings?.criarOrcamentos !== false) &&
      (link.to !== "/recorrencia" || settings?.criarRecorrencias !== false),
  );

  return (
    <aside className="hidden xl:sticky xl:top-0 xl:flex xl:h-screen xl:py-3">
      <div className="flex min-h-0 w-full flex-col rounded-[28px] border border-slate-200 bg-white p-3 shadow-soft">
        <div className="flex items-center gap-2 px-2 py-1">
          <AppBrandIcon className="h-9 w-9 shrink-0 rounded-2xl p-0" />
          <p className="text-[11px] uppercase tracking-[0.32em] text-brand-700">AgendaPro</p>
        </div>

        <div className="mt-3 rounded-[22px] bg-slate-50/90 px-4 py-3">
          <p className="truncate text-base font-semibold text-ink">
            {organization?.nomeEmpresa ?? "Configuracao inicial em andamento"}
          </p>
          <p className="mt-1 truncate text-sm text-slate-500">
            {user?.nome ?? "Usuario"} - {role ?? "sem perfil"}
          </p>
        </div>

        <nav className="mt-3 min-h-0 flex-1 overflow-y-auto">
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

        <div className="mt-3 border-t border-slate-100 pt-3">
          <Button className="w-full bg-night text-white hover:bg-ink" onClick={() => void signOut()}>
            Sair
          </Button>
          <p className="mt-3 text-center text-[10px] leading-4 text-slate-400" aria-label={SYSTEM_VERSION_LABEL}>
            {SYSTEM_VERSION_LABEL}
          </p>
        </div>
      </div>
    </aside>
  );
}
