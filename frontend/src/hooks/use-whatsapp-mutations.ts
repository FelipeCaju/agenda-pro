import { useMutation, useQueryClient } from "@tanstack/react-query";
import { whatsappService, type WhatsappMessageInput } from "@/services/whatsappService";
import { whatsappKeys } from "@/hooks/use-whatsapp-status-query";

export function useWhatsappMutations() {
  const queryClient = useQueryClient();

  const testMutation = useMutation({
    mutationFn: (input: WhatsappMessageInput) => whatsappService.sendTestMessage(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: whatsappKeys.all,
      });
    },
  });

  return {
    sendWhatsappTestMessage: testMutation.mutateAsync,
    isSendingWhatsappTest: testMutation.isPending,
    sendWhatsappTestError: testMutation.error,
  };
}
