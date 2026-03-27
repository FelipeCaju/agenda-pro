import { FormEvent, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PasswordField } from "@/components/ui/password-field";
import { useAuth } from "@/hooks/use-auth";
import { ApiError } from "@/services/apiClient";
import { getPostAuthRedirect } from "@/utils/auth";

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { clearError, error, isLoading, isSessionExpired, signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isStartingTrial, setIsStartingTrial] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const redirectTo = (location.state as { from?: string } | null)?.from ?? "/";
  const successMessage = (location.state as { successMessage?: string } | null)?.successMessage ?? "";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setLocalError(null);

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

  async function handleStartTrial() {
    const normalizedEmail = email.trim().toLowerCase();
    setLocalError(null);

    if (!normalizedEmail) {
      setLocalError("Informe seu email para criar a conta.");
      return;
    }

    setIsStartingTrial(true);

    try {
      const session = await signIn({
        email: normalizedEmail,
        password: "__start_onboarding__",
        provider: "email",
      });

      if (session.access.needsOnboarding) {
        navigate("/onboarding", { replace: true });
        return;
      }

      navigate(getPostAuthRedirect(session), { replace: true });
    } catch (signInError) {
      if (signInError instanceof ApiError && [401, 403, 409].includes(signInError.status)) {
        setLocalError("Esse email ja possui conta. Use sua senha para entrar.");
      } else if (signInError instanceof Error) {
        setLocalError(signInError.message);
      } else {
        setLocalError("Nao foi possivel iniciar o cadastro agora.");
      }
    } finally {
      setIsStartingTrial(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <Card className="w-full max-w-lg border-white/90 bg-white/[0.88] p-6 shadow-float">
        <span className="app-pill">AgendaPro</span>
        <h1 className="mt-4 text-3xl font-bold tracking-[-0.04em] text-ink">Entrar</h1>
        <p className="mt-3 text-sm leading-7 text-slate-500">
          Acesso seguro por email e senha, com criacao de conta e trial direto pela tela inicial.
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
          {localError ? <p className="text-sm text-rose-600">{localError}</p> : null}
          {error ? <p className="text-sm text-rose-600">{error}</p> : null}
          {successMessage ? <p className="text-sm text-emerald-700">{successMessage}</p> : null}
          <Button className="w-full" disabled={isSubmitting || isLoading} type="submit">
            {isSubmitting ? "Entrando..." : "Entrar com email e senha"}
          </Button>
          <Button
            className="w-full"
            disabled={isSubmitting || isLoading || isStartingTrial}
            onClick={handleStartTrial}
            type="button"
            variant="secondary"
          >
            {isStartingTrial ? "Abrindo cadastro..." : "Criar conta"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
