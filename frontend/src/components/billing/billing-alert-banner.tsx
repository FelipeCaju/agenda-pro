import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useBillingOverviewQuery } from "@/hooks/use-billing-query";
import { formatDateBR } from "@/utils/date";
import { getSubscriptionStatusLabel } from "@/utils/billing";

export function BillingAlertBanner() {
  const navigate = useNavigate();
  const { data: overview } = useBillingOverviewQuery();

  if (!overview?.access.paymentNoticeVisible && !overview?.access.isBlocked) {
    return null;
  }

  const toneClass = overview.access.isBlocked
    ? "border-rose-100 bg-rose-50/90"
    : "border-amber-100 bg-amber-50/90";
  const textClass = overview.access.isBlocked ? "text-rose-700" : "text-amber-700";

  return (
    <div className={`rounded-[18px] border px-4 py-4 shadow-soft ${toneClass}`}>
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className={`text-sm font-semibold ${textClass}`}>
            {overview.access.isBlocked ? "Acesso restrito por billing" : "Atencao com a cobranca atual"}
          </p>
          <p className={`mt-1 text-sm ${textClass}`}>
            Status {getSubscriptionStatusLabel(overview.access.subscriptionStatus)}.
            {overview.access.dueDate ? ` Vencimento em ${formatDateBR(overview.access.dueDate)}.` : ""}
            {overview.access.graceUntil ? ` Tolerancia ate ${formatDateBR(overview.access.graceUntil)}.` : ""}
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button onClick={() => navigate("/meu-plano")} type="button" variant="secondary">
            Meu plano
          </Button>
          <Button onClick={() => navigate("/pagamento")} type="button">
            Regularizar
          </Button>
        </div>
      </div>
    </div>
  );
}
