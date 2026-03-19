import type { AuthSession } from "@/services/authService";

export function getPostAuthRedirect(session: AuthSession | null) {
  if (!session) {
    return "/login";
  }

  if (session.scope === "platform") {
    return "/admin";
  }

  if (session.access.needsOnboarding) {
    return "/onboarding";
  }

  if (session.access.isBlocked) {
    return "/assinatura-bloqueada";
  }

  return "/";
}
