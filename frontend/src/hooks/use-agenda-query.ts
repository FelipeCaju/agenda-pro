import { useQuery } from "@tanstack/react-query";
import {
  appointmentService,
  type AgendaView,
} from "@/services/appointmentService";
import { getTodayDate } from "@/utils/agenda";

export const agendaKeys = {
  all: ["agenda"] as const,
  lists: () => [...agendaKeys.all, "list"] as const,
  list: (date: string, view: AgendaView, professionalId?: string) =>
    [...agendaKeys.lists(), { date, view, professionalId: professionalId ?? "" }] as const,
  details: () => [...agendaKeys.all, "detail"] as const,
  detail: (appointmentId: string) => [...agendaKeys.details(), appointmentId] as const,
};

export function useAgendaQuery({
  date = getTodayDate(),
  view = "day" as AgendaView,
  professionalId,
}: {
  date?: string;
  view?: AgendaView;
  professionalId?: string;
} = {}) {
  return useQuery({
    queryKey: agendaKeys.list(date, view, professionalId),
    queryFn: () => appointmentService.list({ date, view, professionalId }),
    staleTime: 30_000,
    refetchOnWindowFocus: false,
    placeholderData: (previousData) => previousData,
  });
}
