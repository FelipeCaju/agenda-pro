import { useLocation, useNavigate } from "react-router-dom";
import { MobilePageHeader } from "@/components/layout/mobile-page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FullscreenState } from "@/components/ui/fullscreen-state";
import { useBillingInvoicesQuery, useBillingOverviewQuery } from "@/hooks/use-billing-query";
import { getBillingPaymentAccessFromOverview, getPaymentStatusLabel } from "@/utils/billing";
import { formatDateBR, formatMonthYearBR } from "@/utils/date";
import { resolveBackPath } from "@/utils/navigation";

function formatCurrencyFromCents(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(value ?? 0) / 100);
}

export function BillingInvoicesPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { data: invoices = [], error, isError, isLoading } = useBillingInvoicesQuery();
  const { data: overview } = useBillingOverviewQuery();
  const paymentAccess = getBillingPaymentAccessFromOverview(overview?.access, overview?.currentCharge);
  const backPath = resolveBackPath(location, "/meu-plano");

  if (isLoading && !invoices.length) {
    return (
      <FullscreenState
        eyebrow="Billing"
        title="Carregando faturas"
        description="Estamos buscando o historico de cobrancas."
      />
    );
  }

  if (isError) {
    return (
      <FullscreenState
        eyebrow="Billing"
        title="Nao foi possivel carregar as faturas"
        description={error?.message ?? "Falha ao carregar as faturas."}
      />
    );
  }

  return (
    <section className="space-y-4">
      <MobilePageHeader
        action={
          <Button onClick={() => navigate(backPath)} type="button" variant="secondary">
            Voltar
          </Button>
        }
        subtitle="Historico de cobrancas"
        title="Faturas"
      />

      <Card className="space-y-3">
        {invoices.length ? (
          invoices.map((invoice) => (
            <div
              className="flex items-start justify-between gap-3 rounded-2xl border border-slate-100 bg-slate-50/80 px-4 py-4"
              key={invoice.id}
            >
              <div className="min-w-0">
                <p className="font-medium text-ink">
                  {invoice.dueDate ? formatMonthYearBR(invoice.dueDate.slice(0, 7)) : "Fatura"}
                </p>
                <p className="text-sm text-slate-500">
                  Vencimento {formatDateBR(invoice.dueDate)}
                </p>
                {invoice.confirmedAt ? (
                  <p className="text-sm text-slate-500">
                    Confirmada em {formatDateBR(invoice.confirmedAt)}
                  </p>
                ) : null}
                {invoice.invoiceUrl &&
                paymentAccess.canOpen &&
                (invoice.status === "pending" || invoice.status === "overdue") ? (
                  <button
                    className="mt-2 text-sm font-semibold text-brand-700"
                    onClick={() => window.open(invoice.invoiceUrl ?? "", "_blank", "noopener,noreferrer")}
                    type="button"
                  >
                    Abrir fatura hospedada
                  </button>
                ) : null}
              </div>
              <div className="text-right">
                <p className="font-semibold text-ink">{formatCurrencyFromCents(invoice.amountCents)}</p>
                <p className="mt-1 text-xs font-semibold uppercase tracking-[0.16em] text-brand-600">
                  {getPaymentStatusLabel(invoice.status)}
                </p>
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm text-slate-500">Nenhuma fatura encontrada ainda.</p>
        )}
      </Card>
    </section>
  );
}
