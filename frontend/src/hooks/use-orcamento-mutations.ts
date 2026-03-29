import { useMutation, useQueryClient } from "@tanstack/react-query";
import { orcamentoKeys } from "@/hooks/use-orcamentos-query";
import { orcamentoService, type OrcamentoInput } from "@/services/orcamentoService";

export function useOrcamentoMutations() {
  const queryClient = useQueryClient();

  async function invalidateQuote(quoteId?: string) {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: orcamentoKeys.all }),
      quoteId
        ? queryClient.invalidateQueries({ queryKey: orcamentoKeys.detail(quoteId) })
        : Promise.resolve(),
    ]);
  }

  const createMutation = useMutation({
    mutationFn: (input: OrcamentoInput) => orcamentoService.create(input),
    onSuccess: async () => invalidateQuote(),
  });

  const updateMutation = useMutation({
    mutationFn: ({ quoteId, input }: { quoteId: string; input: OrcamentoInput }) =>
      orcamentoService.update(quoteId, input),
    onSuccess: async (_, variables) => invalidateQuote(variables.quoteId),
  });

  const approveMutation = useMutation({
    mutationFn: (quoteId: string) => orcamentoService.approve(quoteId),
    onSuccess: async (_, quoteId) => invalidateQuote(quoteId),
  });

  const rejectMutation = useMutation({
    mutationFn: (quoteId: string) => orcamentoService.reject(quoteId),
    onSuccess: async (_, quoteId) => invalidateQuote(quoteId),
  });

  const serviceOrderMutation = useMutation({
    mutationFn: (quoteId: string) => orcamentoService.convertToServiceOrder(quoteId),
    onSuccess: async (_, quoteId) => invalidateQuote(quoteId),
  });

  return {
    createOrcamento: createMutation.mutateAsync,
    updateOrcamento: updateMutation.mutateAsync,
    approveOrcamento: approveMutation.mutateAsync,
    rejectOrcamento: rejectMutation.mutateAsync,
    convertOrcamentoToOS: serviceOrderMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isApproving: approveMutation.isPending,
    isRejecting: rejectMutation.isPending,
    isConvertingToOS: serviceOrderMutation.isPending,
    createError: createMutation.error,
    updateError: updateMutation.error,
    approveError: approveMutation.error,
    rejectError: rejectMutation.error,
    convertToOSError: serviceOrderMutation.error,
  };
}
