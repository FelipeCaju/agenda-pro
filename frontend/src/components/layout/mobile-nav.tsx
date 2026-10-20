import { useState } from "react";
import { NavLink } from "react-router-dom";
import { AppBrandIcon } from "@/components/ui/app-brand-icon";
import {
  useOrganizationPaymentsQuery,
  useOrganizationQuery,
} from "@/hooks/use-organization-query";
import { useSettingsQuery } from "@/hooks/use-settings-query";
import { getBillingAlert } from "@/utils/billing";
import { cn } from "@/utils/cn";

const links = [
  { to: "/agenda", label: "Agenda", icon: "calendar" },
  { to: "/", label: "Painel", icon: "grid" },
  { to: "/recorrencia", label: "Recorrencia", icon: "money" },
  { to: "/orcamentos", label: "Orcamentos", icon: "receipt" },
  { to: "/clientes", label: "Clientes", icon: "users" },
  { to: "/servicos", label: "Servicos", icon: "scissors" },
  { to: "/planos-atendimento", label: "Planos", icon: "receipt" },
  { to: "/configuracoes/whatsapp", label: "WhatsApp", icon: "whatsapp" },
  { to: "/configuracoes", label: "Config.", icon: "settings" },
  { to: "/dados-da-empresa", label: "Empresa", icon: "building" },
];

function NavIcon({ icon }: { icon: (typeof links)[number]["icon"] }) {
  const baseProps = {
    className: "h-[18px] w-[18px]",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.8",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    viewBox: "0 0 24 24",
  };

  if (icon === "calendar") {
    return (
      <svg {...baseProps}>
        <rect x="3.5" y="5.5" width="17" height="15" rx="3" />
        <path d="M7.5 3.5v4" />
        <path d="M16.5 3.5v4" />
        <path d="M3.5 9.5h17" />
      </svg>
    );
  }

  if (icon === "users") {
    return (
      <svg {...baseProps}>
        <path d="M9 12a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
        <path d="M4.5 18a4.5 4.5 0 0 1 9 0" />
        <path d="M16.5 11a2.5 2.5 0 1 0 0-5" />
        <path d="M19.5 18a3.5 3.5 0 0 0-2.7-3.4" />
      </svg>
    );
  }

  if (icon === "receipt") {
    return (
      <svg {...baseProps}>
        <path d="M7 4.5h10a1 1 0 0 1 1 1v14l-2-1.3-2 1.3-2-1.3-2 1.3-2-1.3-2 1.3v-14a1 1 0 0 1 1-1Z" />
        <path d="M9 8.5h6" />
        <path d="M9 12h6" />
      </svg>
    );
  }

  if (icon === "scissors") {
    return (
      <svg {...baseProps}>
        <circle cx="6.5" cy="7" r="2.5" />
        <circle cx="6.5" cy="17" r="2.5" />
        <path d="M20 4 8.3 14.4" />
        <path d="m20 20-8.7-7.8" />
      </svg>
    );
  }

  if (icon === "money") {
    return (
      <svg {...baseProps}>
        <path d="M12 4v16" />
        <path d="M15.5 7.5c0-1.4-1.6-2.5-3.5-2.5s-3.5 1.1-3.5 2.5S10.1 10 12 10s3.5 1.1 3.5 2.5S13.9 15 12 15s-3.5-1.1-3.5-2.5" />
      </svg>
    );
  }

  if (icon === "grid") {
    return (
      <svg {...baseProps}>
        <rect x="4" y="4" width="6.5" height="6.5" rx="1.5" />
        <rect x="13.5" y="4" width="6.5" height="6.5" rx="1.5" />
        <rect x="4" y="13.5" width="6.5" height="6.5" rx="1.5" />
        <rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.5" />
      </svg>
    );
  }

  if (icon === "building") {
    return (
      <svg {...baseProps}>
        <path d="M4 20V5.5A1.5 1.5 0 0 1 5.5 4h8A1.5 1.5 0 0 1 15 5.5V20" />
        <path d="M15 9h3.5A1.5 1.5 0 0 1 20 10.5V20" />
        <path d="M8 8h3M8 12h3M8 16h3M17 13h.01M17 16h.01M3 20h18" />
      </svg>
    );
  }

  if (icon === "whatsapp") {
    return (
      <svg {...baseProps}>
        <path d="M8.5 18.2 4 20l1.8-4.2A7.5 7.5 0 1 1 19.5 12a7.4 7.4 0 0 1-11 6.2Z" />
        <path d="M9.5 9.3c0 2.8 2.4 5.2 5.2 5.2" />
      </svg>
    );
  }

  return (
    <svg {...baseProps}>
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

export function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);
  const { data: organization } = useOrganizationQuery();
  const { data: payments = [] } = useOrganizationPaymentsQuery();
  const { data: settings } = useSettingsQuery();
  const billingAlert = getBillingAlert(organization, payments);
  const visibleLinks = links.filter(
    (link) =>
      (link.to !== "/orcamentos" || settings?.criarOrcamentos === true) &&
      (link.to !== "/recorrencia" || settings?.criarRecorrencias === true),
  );

  return (
    <div className="xl:hidden">
      <button
        aria-expanded={isOpen}
        aria-label={isOpen ? "Fechar menu" : "Abrir menu"}
        className="fixed left-3 top-[max(env(safe-area-inset-top),0.75rem)] z-[70] flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-ink shadow-[0_8px_18px_rgba(15,23,42,0.12)] transition hover:bg-slate-50"
        onClick={() => setIsOpen((current) => !current)}
        type="button"
      >
        <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2" viewBox="0 0 24 24">
          {isOpen ? <path d="m6 6 12 12M18 6 6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
        </svg>
      </button>

      {isOpen ? (
        <>
          <button aria-label="Fechar menu" className="fixed inset-0 z-50 bg-slate-950/30" onClick={() => setIsOpen(false)} type="button" />
          <aside className="fixed inset-y-0 left-0 z-[60] flex w-[272px] max-w-[86vw] flex-col border-r border-[#c9d9ea] bg-[#dce8f5] px-5 pb-6 pt-[max(calc(env(safe-area-inset-top)+4.75rem),5rem)] shadow-2xl">
            <div className="flex items-center gap-2 border-b border-[#c4d5e7] pb-4">
              <AppBrandIcon className="h-9 w-9 shrink-0 rounded-2xl p-0" />
              <p className="text-[11px] uppercase tracking-[0.32em] text-brand-800">AgendaPro</p>
            </div>
            <nav className="mt-5 min-h-0 flex-1 overflow-y-auto">
              <div className="space-y-1">
        {visibleLinks.map((link) => (
          <NavLink
            end={link.to === "/configuracoes"}
            key={link.to}
            to={link.to}
            onClick={() => setIsOpen(false)}
            className={({ isActive }) =>
              cn(
                "relative flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13px] font-semibold text-slate-600 transition hover:bg-white/45 hover:text-brand-800",
                isActive && "bg-white/75 text-brand-800 shadow-[0_6px_18px_rgba(37,99,235,0.08)]",
              )
            }
          >
            {link.to === "/configuracoes" && billingAlert.hasAlert ? (
              <span className="absolute right-3 top-2 h-2.5 w-2.5 rounded-full bg-rose-500 ring-2 ring-white" />
            ) : null}
            <NavIcon icon={link.icon} />
            {link.label}
          </NavLink>
        ))}
              </div>
            </nav>
          </aside>
        </>
      ) : null}
      </div>
  );
}
