import { useMutation, useQueryClient } from "@tanstack/react-query";
import { dashboardKeys } from "@/hooks/use-dashboard-summary";
import { settingsKeys } from "@/hooks/use-settings-query";
import { settingsService, type AppSettings } from "@/services/settingsService";

export function useSettingsMutations() {
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: (input: Partial<AppSettings>) => settingsService.update(input),
    onSuccess: async (data) => {
      queryClient.setQueryData(settingsKeys.current(), data);

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: settingsKeys.all }),
        queryClient.invalidateQueries({ queryKey: dashboardKeys.all }),
      ]);
    },
  });

  return {
    updateSettings: updateMutation.mutateAsync,
    isUpdatingSettings: updateMutation.isPending,
    updateSettingsError: updateMutation.error,
  };
}
