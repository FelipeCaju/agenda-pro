import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "@/utils/cn";

export const Card = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(function Card(
  { className, ...props },
  ref,
) {
  return (
    <div
      className={cn(
        "rounded-[22px] border border-slate-200 bg-white p-5 shadow-[0_6px_18px_rgba(15,23,42,0.05)] xl:rounded-[24px] xl:p-6",
        className,
      )}
      ref={ref}
      {...props}
    />
  );
});
