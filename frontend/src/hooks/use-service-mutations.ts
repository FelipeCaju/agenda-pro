import { useMutation, useQueryClient } from "@tanstack/react-query";
import { dashboardKeys } from "@/hooks/use-dashboard-summary";
import { serviceKeys } from "@/hooks/use-services-query";
import {
  serviceService,
  type BusinessServiceInput,
} from "@/services/serviceService";

export function useServiceMutations() {
  const queryClient = useQueryClient();

  const invalidateServices = () =>
    queryClient.invalidateQueries({
      queryKey: serviceKeys.all,
    });

  const invalidateDashboard = () =>
    queryClient.invalidateQueries({
      queryKey: dashboardKeys.all,
    });

  const createMutation = useMutation({
    mutationFn: (input: BusinessServiceInput) => serviceService.create(input),
    onSuccess: async () => {
      await Promise.all([invalidateServices(), invalidateDashboard()]);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ serviceId, input }: { serviceId: string; input: BusinessServiceInput }) =>
      serviceService.update(serviceId, input),
    onSuccess: async (_, variables) => {
      await Promise.all([
        invalidateServices(),
        invalidateDashboard(),
        queryClient.invalidateQueries({
          queryKey: serviceKeys.detail(variables.serviceId),
        }),
      ]);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (serviceId: string) => serviceService.remove(serviceId),
    onSuccess: async () => {
      await Promise.all([invalidateServices(), invalidateDashboard()]);
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ serviceId, ativo }: { serviceId: string; ativo: boolean }) =>
      serviceService.setActive(serviceId, ativo),
    onSuccess: async (_, variables) => {
      await Promise.all([
        invalidateServices(),
        invalidateDashboard(),
        queryClient.invalidateQueries({
          queryKey: serviceKeys.detail(variables.serviceId),
        }),
      ]);
    },
  });

  return {
    createService: createMutation.mutateAsync,
    updateService: updateMutation.mutateAsync,
    deleteService: deleteMutation.mutateAsync,
    toggleServiceActive: toggleActiveMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isToggling: toggleActiveMutation.isPending,
    createError: createMutation.error,
    updateError: updateMutation.error,
    deleteError: deleteMutation.error,
    toggleError: toggleActiveMutation.error,
  };
}
