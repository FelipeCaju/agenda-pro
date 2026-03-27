import { type ReactNode } from "react";
import { AppBrandIcon } from "@/components/ui/app-brand-icon";
import { cn } from "@/utils/cn";

type MobilePageHeaderProps = {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  leading?: ReactNode;
  className?: string;
};

export function MobilePageHeader({
  title,
  subtitle,
  action,
  leading,
  className,
}: MobilePageHeaderProps) {
  return (
    <div
      className={cn(
        "sticky top-0 z-[55] -mx-3 border-b border-slate-100 bg-white/95 px-3 backdrop-blur-xl sm:-mx-4 sm:px-4 xl:static xl:mx-0 xl:border-b-0 xl:bg-transparent xl:px-0 xl:backdrop-blur-none",
        className,
      )}
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <div className="mx-auto flex min-h-14 items-center justify-between gap-3 xl:max-w-none">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          {leading ? <div className="flex shrink-0 items-center">{leading}</div> : null}
          <AppBrandIcon className="h-9 w-9 shrink-0 rounded-2xl p-0 shadow-[0_8px_18px_rgba(15,23,42,0.12)] xl:h-10 xl:w-10" />
          <div className="min-w-0">
            <h1 className="truncate text-lg font-semibold text-slate-900 xl:text-[2rem] xl:tracking-[-0.04em]">
              {title}
            </h1>
            {subtitle ? (
              <p className="truncate text-xs text-slate-500 xl:mt-1 xl:text-sm">{subtitle}</p>
            ) : null}
          </div>
        </div>
        {action ? <div className="ml-2 shrink-0">{action}</div> : null}
      </div>
    </div>
  );
}
