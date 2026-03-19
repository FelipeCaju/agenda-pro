import { useRef, useState, type ReactNode, type TouchEvent } from "react";

type PullToRefreshProps = {
  children: ReactNode;
  isRefreshing?: boolean;
  onRefresh: () => Promise<unknown>;
};

export function PullToRefresh({
  children,
  isRefreshing = false,
  onRefresh,
}: PullToRefreshProps) {
  const startYRef = useRef<number | null>(null);
  const [distance, setDistance] = useState(0);

  function handleTouchStart(event: TouchEvent<HTMLDivElement>) {
    if (window.scrollY > 0) {
      startYRef.current = null;
      return;
    }

    startYRef.current = event.touches[0]?.clientY ?? null;
  }

  function handleTouchMove(event: TouchEvent<HTMLDivElement>) {
    if (startYRef.current === null) {
      return;
    }

    const nextDistance = Math.max(0, (event.touches[0]?.clientY ?? 0) - startYRef.current);
    setDistance(Math.min(nextDistance, 100));
  }

  async function handleTouchEnd() {
    if (distance >= 70 && !isRefreshing) {
      await onRefresh();
    }

    startYRef.current = null;
    setDistance(0);
  }

  return (
    <div onTouchEnd={handleTouchEnd} onTouchMove={handleTouchMove} onTouchStart={handleTouchStart}>
      <div className="flex h-8 items-center justify-center text-xs text-slate-400">
        {isRefreshing ? "Atualizando agenda..." : distance >= 70 ? "Solte para atualizar" : "Puxe para atualizar"}
      </div>
      {children}
    </div>
  );
}
