import { Card } from "@/components/ui/card";

type InlineStateCardProps = {
  tone?: "default" | "error";
  message: string;
};

export function InlineStateCard({
  tone = "default",
  message,
}: InlineStateCardProps) {
  return (
    <Card className={tone === "error" ? "border-rose-100 bg-rose-50/80" : undefined}>
      <p className={tone === "error" ? "text-sm text-rose-700" : "text-sm text-slate-500"}>
        {message}
      </p>
    </Card>
  );
}
