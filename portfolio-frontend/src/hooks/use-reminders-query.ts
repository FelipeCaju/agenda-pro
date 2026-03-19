import { useQuery } from "@tanstack/react-query";
import { reminderService } from "@/services/reminderService";

export function useRemindersQuery() {
  return useQuery({
    queryKey: ["reminders"],
    queryFn: () => reminderService.list(),
    staleTime: 30_000,
    placeholderData: (previousData) => previousData,
  });
}
