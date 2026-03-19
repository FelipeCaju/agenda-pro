import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  adminService,
  type AdminOrganizationCreateInput,
  type AdminPaymentInput,
  type AdminSubscriptionInput,
} from "@/services/adminService";

export function useAdminMutations(organizationId?: string) {
  const queryClient = useQueryClient();

  const updateSubscriptionMutation = useMutation({
    mutationFn: (input: AdminSubscriptionInput) =>
      adminService.updateSubscription(organizationId!, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "organizations"] });
      void queryClient.invalidateQueries({ queryKey: ["admin", "organizations", organizationId] });
    },
  });

  const createPaymentMutation = useMutation({
    mutationFn: (input: AdminPaymentInput) => adminService.createPayment(organizationId!, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "organizations"] });
      void queryClient.invalidateQueries({ queryKey: ["admin", "organizations", organizationId] });
      void queryClient.invalidateQueries({ queryKey: ["admin", "payments", organizationId] });
    },
  });

  const createOrganizationMutation = useMutation({
    mutationFn: (input: AdminOrganizationCreateInput) => adminService.createOrganization(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "organizations"] });
    },
  });

  return {
    updateSubscription: updateSubscriptionMutation.mutateAsync,
    createPayment: createPaymentMutation.mutateAsync,
    createOrganization: createOrganizationMutation.mutateAsync,
    isUpdatingSubscription: updateSubscriptionMutation.isPending,
    isCreatingPayment: createPaymentMutation.isPending,
    isCreatingOrganization: createOrganizationMutation.isPending,
    updateSubscriptionError: updateSubscriptionMutation.error,
    createPaymentError: createPaymentMutation.error,
    createOrganizationError: createOrganizationMutation.error,
  };
}
