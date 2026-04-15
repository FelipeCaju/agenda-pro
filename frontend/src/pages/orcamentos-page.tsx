import { useNavigate } from "react-router-dom";
import { MobilePageHeader } from "@/components/layout/mobile-page-header";
import { Card } from "@/components/ui/card";
import { FloatingActionButton } from "@/components/ui/floating-action-button";
import { useOrcamentosQuery } from "@/hooks/use-orcamentos-query";
import { formatDateBr } from "@/utils/date";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function getStatusLabel(status: string) {
  if (status === "aprovado") return "Aprovado";
  if (status === "recusado") return "Recusado";
  return "Pendente";
}

export function OrcamentosPage() {
  const navigate = useNavigate();
  const { data: quotes = [], error, isError, isLoading } = useOrcamentosQuery();

  return (
    <section className="space-y-4 pb-24">
      <MobilePageHeader subtitle="Propostas e conversoes" title="Orcamentos" />

      {isLoading ? (
        <Card>
          <p className="text-sm text-slate-500">Carregando orcamentos...</p>
        </Card>
      ) : null}

      {isError ? (
        <Card className="app-message-error">
          <p className="text-sm font-medium">{error.message}</p>
        </Card>
      ) : null}

      {!isLoading && !quotes.length ? (
        <Card>
          <p className="text-sm font-medium text-ink">Nenhum orcamento criado ainda.</p>
          <p className="mt-1 text-sm text-slate-500">
            Crie propostas com varios servicos e depois converta para agenda ou ordem de servico.
          </p>
        </Card>
      ) : null}

      <div className="space-y-3">
        {quotes.map((quote) => (
          <button
            className="w-full text-left"
            key={quote.id}
            onClick={() => navigate(`/orcamentos/${quote.id}`)}
            type="button"
          >
            <Card className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-base font-semibold text-ink">{quote.clientName}</p>
                  <p className="text-sm text-slate-500">
                    {quote.items.length} item(ns) • Criado em {formatDateBr(quote.createdAt)}
                  </p>
                </div>
                <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
                  {getStatusLabel(quote.status)}
                </span>
              </div>

              <div className="flex items-center justify-between gap-3 text-sm text-slate-500">
                <span>Total</span>
                <span className="text-base font-semibold text-ink">{formatCurrency(quote.total)}</span>
              </div>
            </Card>
          </button>
        ))}
      </div>

      <FloatingActionButton label="Novo" onClick={() => navigate("/orcamentos/novo")} />
    </section>
  );
}
