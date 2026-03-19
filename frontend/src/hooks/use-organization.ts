import { useAuth } from "@/hooks/use-auth";

export function useOrganization() {
  const auth = useAuth();

  return {
    organization: auth.organization,
    organizationId: auth.organizationId,
    role: auth.role,
    isSubscriptionBlocked: auth.isSubscriptionBlocked,
    subscriptionBlockReason: auth.subscriptionBlockReason,
  };
}
