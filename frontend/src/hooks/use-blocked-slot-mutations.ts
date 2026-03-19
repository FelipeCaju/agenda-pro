import { useMutation, useQueryClient } from "@tanstack/react-query";
import { blockedSlotKeys } from "@/hooks/use-blocked-slots-query";
import { agendaKeys } from "@/hooks/use-agenda-query";
import { blockedSlotService, type BlockedSlotInput } from "@/services/blockedSlotService";

export function useBlockedSlotMutations() {
  const queryClient = useQueryClient();

  const invalidateAll = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: blockedSlotKeys.all }),
      queryClient.invalidateQueries({ queryKey: agendaKeys.all }),
    ]);
  };

  const createMutation = useMutation({
    mutationFn: (input: BlockedSlotInput) => blockedSlotService.create(input),
    onSuccess: invalidateAll,
  });

  const deleteMutation = useMutation({
    mutationFn: (blockedSlotId: string) => blockedSlotService.remove(blockedSlotId),
    onSuccess: invalidateAll,
  });

  return {
    createBlockedSlot: createMutation.mutateAsync,
    deleteBlockedSlot: deleteMutation.mutateAsync,
    isCreatingBlockedSlot: createMutation.isPending,
    isDeletingBlockedSlot: deleteMutation.isPending,
    createBlockedSlotError: createMutation.error,
    deleteBlockedSlotError: deleteMutation.error,
  };
}
