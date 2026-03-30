import { FormEvent, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PasswordField } from "@/components/ui/password-field";
import { useAuth } from "@/hooks/use-auth";
import { getPostAuthRedirect } from "@/utils/auth";

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { clearError, error, isLoading, isSessionExpired, signIn } = useAuth();
  const [email, setEmail] = useState(
    ((location.state as { prefillEmail?: string } | null)?.prefillEmail ?? "").trim(),
  );
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const redirectTo = (location.state as { from?: string } | null)?.from ?? "/";
  const successMessage = (location.state as { successMessage?: string } | null)?.successMessage ?? "";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      const session = await signIn({ email, password, provider: "email" });
      const nextPath = session.access.needsOnboarding
        ? "/onboarding"
        : session.access.isBlocked
          ? "/assinatura-bloqueada"
          : redirectTo === "/login"
            ? getPostAuthRedirect(session)
            : redirectTo;

      navigate(nextPath, { replace: true });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <Card className="w-full max-w-lg border-white/90 bg-white/[0.88] p-6 shadow-float">
        <span className="app-pill">AgendaPro</span>
        <h1 className="mt-4 text-3xl font-bold tracking-[-0.04em] text-ink">Entrar</h1>
        <p className="mt-3 text-sm leading-7 text-slate-500">
          Entre com seu email e senha. Se ainda nao tiver acesso, abra sua conta em uma tela separada.
        </p>
        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <input
            className="app-input"
            onChange={(event) => {
              clearError();
              setEmail(event.target.value);
            }}
            placeholder="Seu email"
            value={email}
          />
          <PasswordField
            inputClassName="app-input pr-14"
            onChange={(event) => {
              clearError();
              setPassword(event.target.value);
            }}
            placeholder="Sua senha"
            value={password}
          />
          {isSessionExpired ? (
            <p className="text-sm text-amber-700">Sua sessao expirou. Entre novamente.</p>
          ) : null}
          {error ? <p className="text-sm text-rose-600">{error}</p> : null}
          {successMessage ? <p className="text-sm text-emerald-700">{successMessage}</p> : null}
          <Button className="w-full" disabled={isSubmitting || isLoading} type="submit">
            {isSubmitting ? "Entrando..." : "Entrar com email e senha"}
          </Button>
          <Button
            className="w-full"
            onClick={() => navigate("/criar-conta", { state: { prefillEmail: email.trim() } })}
            type="button"
            variant="secondary"
          >
            Criar conta
          </Button>
        </form>
      </Card>
    </div>
  );
}
