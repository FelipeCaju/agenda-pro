import { Card } from "@/components/ui/card";
import { cn } from "@/utils/cn";

type KpiCardProps = {
  label: string;
  value: string;
  hint: string;
};

export function KpiCard({ label, value, hint }: KpiCardProps) {
  const valueClassName =
    value.length >= 13
      ? "text-[1.85rem] leading-none"
      : value.length >= 10
        ? "text-[2.15rem] leading-none"
        : "text-3xl";

  return (
    <Card className="bg-white/[0.84]">
      <p className="text-xs uppercase tracking-[0.24em] text-slate-500">{label}</p>
      <p
        className={cn(
          "mt-4 break-words font-bold tracking-[-0.04em] text-ink",
          valueClassName,
        )}
      >
        {value}
      </p>
      <p className="mt-2 text-sm leading-6 text-slate-500">{hint}</p>
    </Card>
  );
}
