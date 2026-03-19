import { DesktopSidebar } from "@/components/layout/desktop-sidebar";
import { Outlet } from "react-router-dom";
import { MobileNav } from "@/components/layout/mobile-nav";

export function AppShell() {
  return (
    <div className="min-h-screen bg-transparent pb-28 xl:grid xl:grid-cols-[320px_minmax(0,1fr)] xl:gap-6 xl:px-6 xl:pb-0 2xl:px-8">
      <DesktopSidebar />
      <div className="min-w-0">
        <main className="mx-auto flex w-full max-w-md flex-col gap-4 overflow-x-hidden px-3 pb-4 pt-0 sm:max-w-xl sm:px-4 md:max-w-3xl xl:max-w-none xl:px-0 xl:pb-8 xl:pt-6 xl:pr-2 xl:gap-5">
          <Outlet />
        </main>
      </div>
      <MobileNav />
    </div>
  );
}
