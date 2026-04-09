import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useBillingOverviewQuery } from "@/hooks/use-billing-query";
import { formatDateBR } from "@/utils/date";
import { getBillingPaymentAccessFromOverview, getSubscriptionStatusLabel } from "@/utils/billing";

function differenceInDays(dateValue?: string | null) {
  if (!dateValue || !/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
    return null;
  }

  const [year, month, day] = dateValue.split("-").map(Number);
  const target = new Date(year, month - 1, day);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  return Math.round((target.getTime() - today.getTime()) / 86_400_000);
}

export function BillingAlertBanner() {
  const navigate = useNavigate();
  const { data: overview } = useBillingOverviewQuery();
  const paymentAccess = getBillingPaymentAccessFromOverview(overview?.access, overview?.currentCharge);
  const dueDate = overview?.currentCharge?.dueDate ?? overview?.access.dueDate ?? null;
  const dueInDays = differenceInDays(dueDate);
  const currentChargeStatus = overview?.currentCharge?.status ?? null;
  const alertWindowDays = Number(overview?.access.alertWindowDays ?? 5);
  const shouldShowWarning =
    overview?.access.isBlocked ||
    ((currentChargeStatus === "pending" || currentChargeStatus === "overdue") &&
      dueInDays !== null &&
      dueInDays <= alertWindowDays);

  if (!overview || !shouldShowWarning || !paymentAccess.canOpen) {
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
            Abrir pagamentos
          </Button>
        </div>
      </div>
    </div>
  );
}
