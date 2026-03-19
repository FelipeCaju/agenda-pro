import { useMutation, useQueryClient } from "@tanstack/react-query";
import { clientKeys } from "@/hooks/use-clients-query";
import { dashboardKeys } from "@/hooks/use-dashboard-summary";
import { clientService, type ClientInput } from "@/services/clientService";

export function useClientMutations() {
  const queryClient = useQueryClient();

  const invalidateClients = () =>
    queryClient.invalidateQueries({
      queryKey: clientKeys.all,
    });

  const invalidateDashboard = () =>
    queryClient.invalidateQueries({
      queryKey: dashboardKeys.all,
    });

  const createMutation = useMutation({
    mutationFn: (input: ClientInput) => clientService.create(input),
    onSuccess: async () => {
      await Promise.all([invalidateClients(), invalidateDashboard()]);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ clientId, input }: { clientId: string; input: ClientInput }) =>
      clientService.update(clientId, input),
    onSuccess: async (_, variables) => {
      await Promise.all([
        invalidateClients(),
        invalidateDashboard(),
        queryClient.invalidateQueries({
          queryKey: clientKeys.detail(variables.clientId),
        }),
      ]);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (clientId: string) => clientService.remove(clientId),
    onSuccess: async () => {
      await Promise.all([invalidateClients(), invalidateDashboard()]);
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ clientId, ativo }: { clientId: string; ativo: boolean }) =>
      clientService.setActive(clientId, ativo),
    onSuccess: async (_, variables) => {
      await Promise.all([
        invalidateClients(),
        invalidateDashboard(),
        queryClient.invalidateQueries({
          queryKey: clientKeys.detail(variables.clientId),
        }),
      ]);
    },
  });

  return {
    createClient: createMutation.mutateAsync,
    updateClient: updateMutation.mutateAsync,
    deleteClient: deleteMutation.mutateAsync,
    toggleClientActive: toggleActiveMutation.mutateAsync,
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
