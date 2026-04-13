import { useMutation, useQueryClient } from "@tanstack/react-query";
import { recurrenceKeys } from "@/hooks/use-recurrence-query";
import {
  recurrenceService,
  type RecurringProfileInput,
} from "@/services/recurrenceService";

export function useRecurrenceMutations() {
  const queryClient = useQueryClient();

  async function invalidateAll(profileId?: string) {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: recurrenceKeys.all }),
      profileId
        ? queryClient.invalidateQueries({ queryKey: recurrenceKeys.profileDetail(profileId) })
        : Promise.resolve(),
    ]);
  }

  const createProfileMutation = useMutation({
    mutationFn: (input: RecurringProfileInput) => recurrenceService.createProfile(input),
    onSuccess: async () => invalidateAll(),
  });

  const updateProfileMutation = useMutation({
    mutationFn: ({ profileId, input }: { profileId: string; input: RecurringProfileInput }) =>
      recurrenceService.updateProfile(profileId, input),
    onSuccess: async (_, variables) => invalidateAll(variables.profileId),
  });

  const toggleProfileMutation = useMutation({
    mutationFn: ({ profileId, ativo }: { profileId: string; ativo: boolean }) =>
      recurrenceService.setProfileActive(profileId, ativo),
    onSuccess: async (_, variables) => invalidateAll(variables.profileId),
  });

  const deleteProfileMutation = useMutation({
    mutationFn: (profileId: string) => recurrenceService.removeProfile(profileId),
    onSuccess: async () => invalidateAll(),
  });

  const payChargeMutation = useMutation({
    mutationFn: ({
      chargeId,
      formaPagamento,
      observacoes,
    }: {
      chargeId: string;
      formaPagamento?: string;
      observacoes?: string;
    }) => recurrenceService.markChargeAsPaid(chargeId, { formaPagamento, observacoes }),
    onSuccess: async () => invalidateAll(),
  });

  const cancelChargeMutation = useMutation({
    mutationFn: ({ chargeId, observacoes }: { chargeId: string; observacoes?: string }) =>
      recurrenceService.cancelCharge(chargeId, { observacoes }),
    onSuccess: async () => invalidateAll(),
  });

  const resendWhatsappMutation = useMutation({
    mutationFn: (chargeId: string) => recurrenceService.resendChargeWhatsapp(chargeId),
    onSuccess: async () => invalidateAll(),
  });

  const runDailyMutation = useMutation({
    mutationFn: (targetDate?: string) => recurrenceService.runDaily(targetDate),
    onSuccess: async () => invalidateAll(),
  });

  return {
    createProfile: createProfileMutation.mutateAsync,
    updateProfile: updateProfileMutation.mutateAsync,
    toggleProfileActive: toggleProfileMutation.mutateAsync,
    deleteProfile: deleteProfileMutation.mutateAsync,
    payCharge: payChargeMutation.mutateAsync,
    cancelCharge: cancelChargeMutation.mutateAsync,
    resendChargeWhatsapp: resendWhatsappMutation.mutateAsync,
    runDaily: runDailyMutation.mutateAsync,
    isCreatingProfile: createProfileMutation.isPending,
    isUpdatingProfile: updateProfileMutation.isPending,
    isTogglingProfile: toggleProfileMutation.isPending,
    isDeletingProfile: deleteProfileMutation.isPending,
    isPayingCharge: payChargeMutation.isPending,
    isCancellingCharge: cancelChargeMutation.isPending,
    isResendingWhatsapp: resendWhatsappMutation.isPending,
    isRunningDaily: runDailyMutation.isPending,
    createProfileError: createProfileMutation.error,
    updateProfileError: updateProfileMutation.error,
    toggleProfileError: toggleProfileMutation.error,
    deleteProfileError: deleteProfileMutation.error,
    payChargeError: payChargeMutation.error,
    cancelChargeError: cancelChargeMutation.error,
    resendWhatsappError: resendWhatsappMutation.error,
    runDailyError: runDailyMutation.error,
  };
}
