import { Outlet } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

export function AdminShell() {
  const { signOut, user } = useAuth();

  return (
    <div className="min-h-screen bg-transparent">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex min-h-14 w-full max-w-6xl items-center justify-between gap-3 px-3 sm:px-4 md:px-5">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-600">
              Administrador do Sistema
            </p>
            <p className="truncate text-sm text-slate-500">{user?.email}</p>
          </div>
          <Button onClick={() => void signOut()} type="button" variant="secondary">
            Sair
          </Button>
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-3 pb-6 pt-4 sm:px-4 md:px-5">
        <Outlet />
      </main>
    </div>
  );
}
