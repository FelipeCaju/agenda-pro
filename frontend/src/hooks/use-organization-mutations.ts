import { useMutation, useQueryClient } from "@tanstack/react-query";
import { dashboardKeys } from "@/hooks/use-dashboard-summary";
import { organizationKeys } from "@/hooks/use-organization-query";
import { organizationService, type OrganizationProfile } from "@/services/organizationService";

export function useOrganizationMutations() {
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: (input: Partial<OrganizationProfile>) => organizationService.updateCurrent(input),
    onSuccess: async (data) => {
      queryClient.setQueryData(organizationKeys.current(), data);

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: organizationKeys.all }),
        queryClient.invalidateQueries({ queryKey: dashboardKeys.all }),
      ]);
    },
  });

  const notifyPaymentPaidMutation = useMutation({
    mutationFn: ({ paymentId, note }: { paymentId: string; note?: string }) =>
      organizationService.notifyPaymentPaid(paymentId, note),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: organizationKeys.current() }),
        queryClient.invalidateQueries({ queryKey: organizationKeys.payments() }),
      ]);
    },
  });

  return {
    updateOrganization: updateMutation.mutateAsync,
    notifyPaymentPaid: notifyPaymentPaidMutation.mutateAsync,
    isUpdatingOrganization: updateMutation.isPending,
    isNotifyingPaymentPaid: notifyPaymentPaidMutation.isPending,
    updateOrganizationError: updateMutation.error,
    notifyPaymentPaidError: notifyPaymentPaidMutation.error,
  };
}
