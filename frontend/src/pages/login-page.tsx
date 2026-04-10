import { FormEvent, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PasswordField } from "@/components/ui/password-field";
import { useAuth } from "@/hooks/use-auth";
import {
  ensureGoogleAuthLoaded,
  getAppleClientId,
  getGoogleClientId,
  signInWithApple,
} from "@/services/socialAuthService";
import { getPostAuthRedirect } from "@/utils/auth";

const SYSTEM_VERSION = "1.0.0.2";
const SYSTEM_UPDATED_AT = "10/04/2026";

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { clearError, error, isLoading, isSessionExpired, signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSigningWithApple, setIsSigningWithApple] = useState(false);
  const [isPreparingGoogle, setIsPreparingGoogle] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const redirectTo = (location.state as { from?: string } | null)?.from ?? "/";
  const successMessage = (location.state as { successMessage?: string } | null)?.successMessage ?? "";
  const googleButtonRef = useRef<HTMLDivElement | null>(null);
  const googleClientId = getGoogleClientId();
  const appleClientId = getAppleClientId();

  async function finishSignIn(provider: "email" | "google" | "apple", payload?: { idToken?: string; email?: string }) {
    const session = await signIn({
      email: payload?.email ?? email,
      password,
      provider,
      idToken: payload?.idToken,
    });
    const nextPath = session.access.needsOnboarding
      ? "/onboarding"
      : session.access.isBlocked
        ? "/assinatura-bloqueada"
        : redirectTo === "/login"
          ? getPostAuthRedirect(session)
          : redirectTo;

    navigate(nextPath, { replace: true });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setLocalError(null);

    try {
      await finishSignIn("email");
    } finally {
      setIsSubmitting(false);
    }
  }

  useEffect(() => {
    const nextEmail = ((location.state as { prefillEmail?: string } | null)?.prefillEmail ?? "").trim();

    if (nextEmail) {
      setEmail(nextEmail);
    }
  }, [location.state]);

  useEffect(() => {
    if (!googleClientId || !googleButtonRef.current) {
      return;
    }

    let isMounted = true;
    setIsPreparingGoogle(true);

    void ensureGoogleAuthLoaded()
      .then(() => {
        if (!isMounted || !googleButtonRef.current || !window.google?.accounts.id) {
          return;
        }

        googleButtonRef.current.innerHTML = "";
        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: async ({ credential }) => {
            setLocalError(null);

            try {
              await finishSignIn("google", { idToken: credential });
            } catch (signInError) {
              if (signInError instanceof Error) {
                setLocalError(signInError.message);
              } else {
                setLocalError("Nao foi possivel entrar com Google.");
              }
            }
          },
          ux_mode: "popup",
          cancel_on_tap_outside: true,
        });
        window.google.accounts.id.renderButton(googleButtonRef.current, {
          theme: "outline",
          size: "large",
          shape: "pill",
          text: "signin_with",
          width: 360,
          logo_alignment: "left",
        });
      })
      .catch(() => {
        if (isMounted) {
          setLocalError("Nao foi possivel preparar o login com Google.");
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsPreparingGoogle(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [googleClientId]);

  async function handleAppleSignIn() {
    setLocalError(null);
    setIsSigningWithApple(true);

    try {
      const idToken = await signInWithApple();
      await finishSignIn("apple", { idToken });
    } catch (signInError) {
      if (signInError instanceof Error) {
        setLocalError(signInError.message);
      } else {
        setLocalError("Nao foi possivel entrar com Apple.");
      }
    } finally {
      setIsSigningWithApple(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <Card className="w-full max-w-lg border-white/90 bg-white/[0.88] p-6 shadow-float">
        <span className="app-pill">AgendaPro</span>
        <h1 className="mt-4 text-3xl font-bold tracking-[-0.04em] text-ink">Entrar</h1>
        <p className="mt-3 text-sm leading-7 text-slate-500">
          Entre com email, Google ou Apple. Se ainda nao tiver acesso, abra sua conta em uma tela separada.
        </p>
        <div className="mt-6 space-y-3">
          {googleClientId ? (
            <div
              className="flex min-h-11 items-center justify-center rounded-[18px] border border-slate-200 bg-white"
              ref={googleButtonRef}
            />
          ) : (
            <button
              className="flex w-full items-center justify-center rounded-[18px] border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-400"
              disabled
              type="button"
            >
              Entrar com Google
            </button>
          )}
          <button
            className="flex w-full items-center justify-center rounded-[18px] bg-black px-4 py-3 text-sm font-semibold text-white shadow-soft disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isSigningWithApple || !appleClientId}
            onClick={() => void handleAppleSignIn()}
            type="button"
          >
            {isSigningWithApple ? "Conectando com Apple..." : "Entrar com Apple"}
          </button>
          <p className="text-center text-xs text-slate-400">
            {isPreparingGoogle
              ? "Preparando login com Google..."
              : "Ou, se preferir, use seu email e senha abaixo."}
          </p>
        </div>
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
            disabled={isSubmitting || isLoading}
            onClick={() => navigate("/criar-conta", { state: { prefillEmail: email.trim() } })}
            type="button"
            variant="secondary"
          >
            Criar conta
          </Button>
        </form>

        <div className="mt-6 flex justify-center">
          <div className="inline-flex max-w-full flex-nowrap items-center gap-1 overflow-hidden rounded-full border border-slate-200/80 bg-white/80 px-3 py-2 text-[11px] text-slate-500 shadow-[0_10px_24px_rgba(15,23,42,0.05)] sm:gap-1.5 sm:px-4 sm:text-xs">
            <span className="whitespace-nowrap font-semibold uppercase tracking-[0.18em] text-slate-400">Sistema</span>
            <span className="whitespace-nowrap text-slate-300">•</span>
            <span className="whitespace-nowrap font-medium text-slate-600">V {SYSTEM_VERSION}</span>
            <span className="whitespace-nowrap text-slate-300">•</span>
            <span className="whitespace-nowrap text-[10px] sm:text-xs">Atualizado em {SYSTEM_UPDATED_AT}</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
