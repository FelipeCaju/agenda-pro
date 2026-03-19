import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useOrganization } from "@/hooks/use-organization";

export function Topbar() {
  const { signOut, user } = useAuth();
  const { organization, role, isSubscriptionBlocked } = useOrganization();

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
    <header className="hidden">
      <div className="mx-auto flex max-w-none flex-col gap-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.32em] text-brand-700">AgendaPro</p>
            <h1 className="mt-1 text-[1.75rem] font-bold tracking-[-0.03em] text-ink">
              Gestao de agenda elegante e pensada para celular
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Tudo alinhado para operacao diaria, visual limpo e fluxo rapido no celular.
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-4 rounded-[28px] border border-slate-200 bg-white p-4 shadow-soft xl:flex-row xl:items-center xl:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="app-pill">Empresa ativa</span>
              {subscriptionLabel ? <span className="app-pill">{subscriptionLabel}</span> : null}
            </div>
            <p className="text-base font-semibold text-ink">
              {organization?.nomeEmpresa ?? "Configuracao inicial em andamento"}
            </p>
            <p className="text-sm text-slate-500">
              {user?.nome ?? "Usuario"} - {role ?? "sem role"}
            </p>
            {isSubscriptionBlocked ? (
              <p className="text-sm font-medium text-amber-700">Acesso limitado por assinatura</p>
            ) : null}
          </div>
          <Button
            className="w-full bg-night text-white hover:bg-ink xl:w-auto"
            onClick={() => void signOut()}
          >
            Sair
          </Button>
        </div>
      </div>
    </header>
  );
}
