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
    <Card className={tone === "error" ? "app-message-error" : "app-message-neutral"}>
      <p className={tone === "error" ? "text-sm font-medium text-rose-700" : "text-sm font-medium text-slate-600"}>
        {message}
      </p>
    </Card>
  );
}
