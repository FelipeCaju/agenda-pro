import { NavLink } from "react-router-dom";
import {
  useOrganizationPaymentsQuery,
  useOrganizationQuery,
} from "@/hooks/use-organization-query";
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
  const { data: organization } = useOrganizationQuery();
  const { data: payments = [] } = useOrganizationPaymentsQuery();
  const { data: settings } = useSettingsQuery();
  const billingAlert = getBillingAlert(organization, payments);
  const visibleLinks = links.filter(
    (link) => link.to !== "/orcamentos" || settings?.criarOrcamentos !== false,
  );

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-slate-200 bg-white px-3 pb-[max(env(safe-area-inset-bottom),0.75rem)] pt-2 xl:hidden">
      <div
        className={cn(
          "mx-auto max-w-3xl gap-1.5 rounded-[24px] bg-white p-2",
          visibleLinks.length <= 5 ? "grid grid-cols-5" : "grid grid-cols-6",
        )}
      >
        {visibleLinks.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              cn(
                "relative flex flex-col items-center justify-center gap-1 rounded-[20px] px-2 py-2.5 text-center text-[10px] font-semibold text-slate-400 transition sm:text-xs",
                isActive && "bg-brand-50 text-brand-700 shadow-soft",
              )
            }
          >
            {link.to === "/gestao" && billingAlert.hasAlert ? (
              <span className="absolute right-3 top-2 h-2.5 w-2.5 rounded-full bg-rose-500 ring-2 ring-white" />
            ) : null}
            <NavIcon icon={link.icon} />
            {link.label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
