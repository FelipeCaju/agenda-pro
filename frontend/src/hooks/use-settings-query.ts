import { useQuery } from "@tanstack/react-query";
import { settingsService } from "@/services/settingsService";

export const settingsKeys = {
  all: ["settings"] as const,
  current: () => [...settingsKeys.all, "current"] as const,
};

export function useSettingsQuery() {
  return useQuery({
    queryKey: settingsKeys.current(),
    queryFn: () => settingsService.get(),
    staleTime: 60_000,
    placeholderData: (previousData) => previousData,
    refetchOnWindowFocus: false,
  });
}
