import { type ReactNode } from "react";
import { Card } from "@/components/ui/card";

type FullscreenStateProps = {
  eyebrow?: string;
  title: string;
  description: string;
  action?: ReactNode;
};

export function FullscreenState({
  eyebrow,
  title,
  description,
  action,
}: FullscreenStateProps) {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <Card className="w-full max-w-lg bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.08)]">
        {eyebrow ? (
          <p className="text-xs uppercase tracking-[0.28em] text-brand-700">{eyebrow}</p>
        ) : null}
        <h1 className="mt-3 text-3xl font-bold tracking-[-0.03em] text-ink">{title}</h1>
        <p className="mt-3 text-sm leading-7 text-slate-500">{description}</p>
        {action ? <div className="mt-6">{action}</div> : null}
      </Card>
    </div>
  );
}
