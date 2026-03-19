import { useMutation, useQueryClient } from "@tanstack/react-query";
import { professionalKeys } from "@/hooks/use-professionals-query";
import { professionalService, type ProfessionalInput } from "@/services/professionalService";

export function useProfessionalMutations() {
  const queryClient = useQueryClient();

  const invalidateProfessionals = () =>
    queryClient.invalidateQueries({
      queryKey: professionalKeys.all,
    });

  const createMutation = useMutation({
    mutationFn: (input: ProfessionalInput) => professionalService.create(input),
    onSuccess: async () => {
      await invalidateProfessionals();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      professionalId,
      input,
    }: {
      professionalId: string;
      input: ProfessionalInput;
    }) => professionalService.update(professionalId, input),
    onSuccess: async () => {
      await invalidateProfessionals();
    },
  });

  return {
    createProfessional: createMutation.mutateAsync,
    updateProfessional: updateMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    createError: createMutation.error,
    updateError: updateMutation.error,
  };
}
