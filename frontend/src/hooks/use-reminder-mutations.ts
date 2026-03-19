import { useMutation, useQueryClient } from "@tanstack/react-query";
import { agendaKeys } from "@/hooks/use-agenda-query";
import { dashboardKeys } from "@/hooks/use-dashboard-summary";
import { reminderService, type ReminderReplyInput } from "@/services/reminderService";

export const reminderKeys = {
  all: ["reminders"] as const,
};

export function useReminderMutations() {
  const queryClient = useQueryClient();

  const invalidateAll = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: reminderKeys.all }),
      queryClient.invalidateQueries({ queryKey: agendaKeys.all }),
      queryClient.invalidateQueries({ queryKey: dashboardKeys.all }),
    ]);
  };

  const sendManualMutation = useMutation({
    mutationFn: (appointmentId: string) => reminderService.sendManual(appointmentId),
    onSuccess: async () => {
      await invalidateAll();
    },
  });

  const replyMutation = useMutation({
    mutationFn: ({
      appointmentId,
      input,
    }: {
      appointmentId: string;
      input: ReminderReplyInput;
    }) => reminderService.registerReply(appointmentId, input),
    onSuccess: async () => {
      await invalidateAll();
    },
  });

  return {
    sendManualReminder: sendManualMutation.mutateAsync,
    registerReminderReply: replyMutation.mutateAsync,
    isSendingManualReminder: sendManualMutation.isPending,
    isRegisteringReminderReply: replyMutation.isPending,
    sendManualReminderError: sendManualMutation.error,
    registerReminderReplyError: replyMutation.error,
  };
}
