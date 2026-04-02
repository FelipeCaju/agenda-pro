import { type HTMLAttributes } from "react";
import { cn } from "@/utils/cn";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-[22px] border border-slate-200 bg-white p-5 shadow-[0_6px_18px_rgba(15,23,42,0.05)] xl:rounded-[24px] xl:p-6",
        className,
      )}
      {...props}
    />
  );
}
