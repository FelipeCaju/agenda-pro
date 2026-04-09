import { useQuery } from "@tanstack/react-query";
import { blockedSlotService } from "@/services/blockedSlotService";
import type { AgendaView } from "@/services/appointmentService";
import { getTodayDate } from "@/utils/agenda";

export const blockedSlotKeys = {
  all: ["blocked-slots"] as const,
  lists: () => [...blockedSlotKeys.all, "list"] as const,
  list: (date: string, view: AgendaView, professionalId?: string) =>
    [...blockedSlotKeys.lists(), { date, view, professionalId: professionalId ?? "" }] as const,
};

export function useBlockedSlotsQuery({
  date = getTodayDate(),
  view = "day" as AgendaView,
  professionalId,
}: {
  date?: string;
  view?: AgendaView;
  professionalId?: string;
} = {}) {
  return useQuery({
    queryKey: blockedSlotKeys.list(date, view, professionalId),
    queryFn: () => blockedSlotService.list({ date, view, professionalId }),
    staleTime: 60_000,
    placeholderData: (previousData) => previousData,
    refetchOnWindowFocus: false,
  });
}
