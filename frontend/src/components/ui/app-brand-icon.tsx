import iconAgendaPro from "@/assets/icon-agenda-pro.png";
import { cn } from "@/utils/cn";

type AppBrandIconProps = {
  className?: string;
  imageClassName?: string;
};

export function AppBrandIcon({ className, imageClassName }: AppBrandIconProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-[24px] bg-slate-950/5 p-1 shadow-[0_10px_24px_rgba(15,23,42,0.08)]",
        className,
      )}
    >
      <img
        alt="AgendaPro"
        className={cn("h-full w-full rounded-[20px] object-cover", imageClassName)}
        src={iconAgendaPro}
      />
    </div>
  );
}
