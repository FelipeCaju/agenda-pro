import { BillingAlertBanner } from "@/components/billing/billing-alert-banner";
import { DesktopSidebar } from "@/components/layout/desktop-sidebar";
import { useLocalNotificationSync } from "@/hooks/use-local-notification-sync";
import { Outlet } from "react-router-dom";
import { MobileNav } from "@/components/layout/mobile-nav";

export function AppShell() {
  const { lastSyncSummary } = useLocalNotificationSync();

  return (
    <div className="min-h-screen bg-transparent pb-28 xl:grid xl:grid-cols-[288px_minmax(0,1fr)] xl:gap-8 xl:px-6 xl:pb-0 2xl:px-8">
      <DesktopSidebar />
      <div className="min-w-0">
        <main className="mx-auto flex w-full max-w-md flex-col gap-4 overflow-x-hidden px-3 pb-4 pt-0 sm:max-w-xl sm:px-4 md:max-w-3xl xl:max-w-[1320px] xl:px-0 xl:pb-10 xl:pt-7 xl:pr-6 xl:gap-5 2xl:max-w-[1380px] 2xl:pr-10">
          {lastSyncSummary ? (
            <div className="rounded-[18px] border border-slate-200 bg-white/90 px-4 py-3 text-sm text-slate-600 shadow-soft">
              {lastSyncSummary}
            </div>
          ) : null}
          <BillingAlertBanner />
          <Outlet />
        </main>
      </div>
      <MobileNav />
    </div>
  );
}
