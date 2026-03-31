import { type ButtonHTMLAttributes } from "react";
import { PlusIcon } from "@/components/ui/icons";
import { cn } from "@/utils/cn";

type FloatingActionButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  label?: string;
};

export function FloatingActionButton({
  className,
  label = "Novo",
  type = "button",
  ...props
}: FloatingActionButtonProps) {
  return (
    <button
      className={cn(
        "fixed bottom-[calc(env(safe-area-inset-bottom)+5.9rem+10px)] right-4 z-[60] inline-flex items-center gap-2 rounded-full bg-brand-500 px-4 py-3 text-sm font-semibold text-white shadow-[0_16px_30px_rgba(29,140,248,0.28)] transition hover:bg-brand-600",
        className,
      )}
      type={type}
      {...props}
    >
      <PlusIcon className="h-4 w-4" />
      {label}
    </button>
  );
}
