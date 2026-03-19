import { Card } from "@/components/ui/card";

type KpiCardProps = {
  label: string;
  value: string;
  hint: string;
};

export function KpiCard({ label, value, hint }: KpiCardProps) {
  return (
    <Card className="bg-white/[0.84]">
      <p className="text-xs uppercase tracking-[0.24em] text-slate-500">{label}</p>
      <p className="mt-4 text-3xl font-bold tracking-[-0.04em] text-ink">{value}</p>
      <p className="mt-2 text-sm leading-6 text-slate-500">{hint}</p>
    </Card>
  );
}
