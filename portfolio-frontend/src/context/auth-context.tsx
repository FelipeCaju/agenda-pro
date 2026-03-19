import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { ApiError } from "@/services/apiClient";
import {
  authService,
  type AuthSession,
  type CompleteOnboardingInput,
  type SignInInput,
  type UserRole,
} from "@/services/authService";
import { logDiagnosticError } from "@/utils/logger";

export type AuthStatus = "loading" | "authenticated" | "unauthenticated" | "expired" | "error";

type AuthContextValue = {
  status: AuthStatus;
  isLoading: boolean;
  isAuthenticated: boolean;
  isPlatformAdmin: boolean;
  isSessionExpired: boolean;
  user: AuthSession["user"] | null;
  organization: AuthSession["organization"] | null;
  organizationId: string | null;
  role: UserRole | null;
  isSubscriptionBlocked: boolean;
  subscriptionBlockReason: string | null;
  needsOnboarding: boolean;
  error: string | null;
  signIn: (input: SignInInput) => Promise<AuthSession>;
  restoreSession: () => Promise<void>;
  completeOnboarding: (input: CompleteOnboardingInput) => Promise<AuthSession>;
  signOut: (options?: { expired?: boolean }) => Promise<void>;
  deleteAccount: () => Promise<void>;
  clearError: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function getFriendlyError(error: unknown) {
  if (error instanceof ApiError && error.status === 401) {
    return "Sua sessao expirou. Entre novamente para continuar.";
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Nao foi possivel validar sua sessao agora.";
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [error, setError] = useState<string | null>(null);

  const applySession = useCallback((nextSession: AuthSession | null) => {
    setSession(nextSession);
    setStatus(nextSession ? "authenticated" : "unauthenticated");
  }, []);

  const restoreSession = useCallback(async () => {
    setStatus("loading");
    setError(null);

    try {
      const nextSession = await authService.getSession();
      applySession(nextSession);
    } catch (sessionError) {
      logDiagnosticError("auth_restore_session", sessionError);
      await authService.signOut();
      setSession(null);

      if (sessionError instanceof ApiError && sessionError.status === 401) {
        setStatus("expired");
      } else {
        setStatus("error");
      }

      setError(getFriendlyError(sessionError));
    }
  }, [applySession]);

  useEffect(() => {
    void restoreSession();
  }, [restoreSession]);

  const signIn = useCallback(async (input: SignInInput) => {
    setStatus("loading");
    setError(null);

    try {
      const nextSession = await authService.signIn(input);
      setSession(nextSession);
      setStatus("authenticated");
      return nextSession;
    } catch (signInError) {
      logDiagnosticError("auth_sign_in", signInError, {
        email: input.email,
      });
      setSession(null);
      setStatus("unauthenticated");
      setError(getFriendlyError(signInError));
      throw signInError;
    }
  }, []);

  const completeOnboarding = useCallback(async (input: CompleteOnboardingInput) => {
    setStatus("loading");
    setError(null);

    try {
      const nextSession = await authService.completeOnboarding(input);
      setSession(nextSession);
      setStatus("authenticated");
      return nextSession;
    } catch (onboardingError) {
      logDiagnosticError("auth_complete_onboarding", onboardingError);
      setStatus("authenticated");
      setError(getFriendlyError(onboardingError));
      throw onboardingError;
    }
  }, []);

  const signOut = useCallback(async (options?: { expired?: boolean }) => {
    try {
      await authService.signOut();
    } catch (signOutError) {
      logDiagnosticError("auth_sign_out", signOutError);
    } finally {
      setSession(null);
      setStatus(options?.expired ? "expired" : "unauthenticated");
      setError(options?.expired ? "Sua sessao expirou. Entre novamente para continuar." : null);
    }
  }, []);

  const deleteAccount = useCallback(async () => {
    try {
      await authService.deleteAccount();
      setSession(null);
      setStatus("unauthenticated");
      setError(null);
    } catch (deleteAccountError) {
      logDiagnosticError("auth_delete_account", deleteAccountError);
      throw deleteAccountError;
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      isLoading: status === "loading",
      isAuthenticated: Boolean(session),
      isPlatformAdmin: session?.scope === "platform",
      isSessionExpired: status === "expired",
      user: session?.user ?? null,
      organization: session?.organization ?? null,
      organizationId: session?.organization?.id ?? session?.user.organizationId ?? null,
      role: session?.scope === "platform" ? "owner" : session?.user.role ?? null,
      isSubscriptionBlocked: session?.access.isBlocked ?? false,
      subscriptionBlockReason: session?.access.blockReason ?? null,
      needsOnboarding: session?.access.needsOnboarding ?? false,
      error,
      signIn,
      restoreSession,
      completeOnboarding,
      signOut,
      deleteAccount,
      clearError: () => setError(null),
    }),
    [deleteAccount, error, restoreSession, session, signIn, signOut, status, completeOnboarding],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuthContext deve ser usado dentro de AuthProvider");
  }

  return context;
}
