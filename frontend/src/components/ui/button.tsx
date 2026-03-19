import { type ButtonHTMLAttributes } from "react";
import { cn } from "@/utils/cn";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
};

const variantClasses = {
  primary:
    "bg-brand-500 text-white hover:-translate-y-0.5 hover:bg-brand-600 hover:shadow-float focus:ring-brand-100",
  secondary:
    "border border-slate-200 bg-white text-ink hover:bg-slate-50 focus:ring-slate-200",
  ghost:
    "bg-transparent text-brand-600 shadow-none hover:bg-brand-50 focus:ring-brand-100",
  danger:
    "bg-rose-500 text-white hover:-translate-y-0.5 hover:bg-rose-600 hover:shadow-float focus:ring-rose-100",
};

export function Button({
  className,
  variant = "primary",
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex min-h-[46px] items-center justify-center rounded-[18px] px-4 py-3 text-sm font-semibold shadow-soft transition duration-200 focus:outline-none focus:ring-4 active:translate-y-0 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-soft disabled:opacity-60",
        variantClasses[variant],
        className,
      )}
      {...props}
    />
  );
}
