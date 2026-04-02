import { useMutation, useQueryClient } from "@tanstack/react-query";
import { billingKeys } from "@/hooks/use-billing-query";
import { billingService } from "@/services/billingService";

export function useBillingMutations() {
  const queryClient = useQueryClient();

  async function refreshBillingQueries() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: billingKeys.all }),
      queryClient.invalidateQueries({ queryKey: ["organization"] }),
    ]);
  }

  const startCheckoutMutation = useMutation({
    mutationFn: () => billingService.startCheckout(),
    onSuccess: refreshBillingQueries,
  });

  const startCardCheckoutMutation = useMutation({
    mutationFn: () => billingService.startCardCheckout(),
    onSuccess: refreshBillingQueries,
  });

  const cancelSubscriptionMutation = useMutation({
    mutationFn: () => billingService.cancelSubscription(),
    onSuccess: refreshBillingQueries,
  });

  const reactivateSubscriptionMutation = useMutation({
    mutationFn: () => billingService.reactivateSubscription(),
    onSuccess: refreshBillingQueries,
  });

  return {
    startCheckout: startCheckoutMutation.mutateAsync,
    startCardCheckout: startCardCheckoutMutation.mutateAsync,
    cancelSubscription: cancelSubscriptionMutation.mutateAsync,
    reactivateSubscription: reactivateSubscriptionMutation.mutateAsync,
    isStartingCheckout: startCheckoutMutation.isPending,
    isStartingCardCheckout: startCardCheckoutMutation.isPending,
    isCancellingSubscription: cancelSubscriptionMutation.isPending,
    isReactivatingSubscription: reactivateSubscriptionMutation.isPending,
    startCheckoutError: startCheckoutMutation.error,
    startCardCheckoutError: startCardCheckoutMutation.error,
    cancelSubscriptionError: cancelSubscriptionMutation.error,
    reactivateSubscriptionError: reactivateSubscriptionMutation.error,
  };
}
