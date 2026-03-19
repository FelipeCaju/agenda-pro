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

  return {
    updateOrganization: updateMutation.mutateAsync,
    isUpdatingOrganization: updateMutation.isPending,
    updateOrganizationError: updateMutation.error,
  };
}
